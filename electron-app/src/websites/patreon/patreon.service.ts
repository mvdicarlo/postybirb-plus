import { Injectable } from '@nestjs/common';
import UserAccountEntity from 'src/account/models/user-account.entity';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import Http from 'src/http/http.util';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/utils/browser-window.util';
import FileSize from 'src/utils/filesize.util';
import { Folder } from '../interfaces/folder.interface';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { PatreonDefaultFileOptions, PatreonDefaultNotificationOptions } from './patreon.defaults';
import { PatreonFileOptions, PatreonNotificationOptions } from './patreon.interface';
import _ = require('lodash');
import WebsiteValidator from 'src/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';

/*
 * Developer note:
 * Patreon really difficult to work around, mostly due to weird CloudFlare issues.
 * Results in some very hacky code.
 */

@Injectable()
export class Patreon extends Website {
  readonly BASE_URL = 'https://www.patreon.com';
  readonly acceptsAdditionalFiles = true;
  readonly fileSubmissionOptions: PatreonFileOptions = PatreonDefaultFileOptions;
  readonly notificationSubmissionOptions: PatreonNotificationOptions = PatreonDefaultNotificationOptions;
  readonly usernameShortcuts = [
    {
      key: 'pa',
      url: 'https://www.patreon.com/$1',
    },
  ];
  readonly acceptsFiles = [
    'png',
    'jpeg',
    'jpg',
    'gif',
    'midi',
    'ogg',
    'oga',
    'wav',
    'x-wav',
    'webm',
    'mp3',
    'mpeg',
    'pdf',
    'txt',
    'rtf',
    'md',
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(`${this.BASE_URL}/user`, data._id);
    const match = res.body.match(/"full_name": "(.*?)"/);
    if (match) {
      status.loggedIn = true;
      status.username = match[1];
      await this.loadTiers(data._id);
    }
    return status;
  }

  private async loadTiers(profileId: string) {
    const csrf = await this.getCSRF(profileId);
    const createData = {
      data: {
        type: 'post',
        attributes: {
          post_type: 'image_file',
        },
      },
    };

    const json = (await this.createPost(profileId, csrf, createData)).data;
    const accessTierPage = await BrowserWindowUtil.getPage(
      profileId,
      `${this.BASE_URL}/api/posts/${json.id}?include=access_rules.tier.null,attachments.null,campaign.access_rules.tier.null,campaign.earnings_visibility,campaign.is_nsfw,images.null,audio.null&fields[access_rule]=access_rule_type`,
    );

    const tierJson = JSON.parse(accessTierPage);
    if (tierJson.included) {
      const customTiers: Folder = {
        label: 'Tiers',
        children: [],
      };

      const tiers: Folder[] = [];

      tierJson.included
        .filter(t => t.type === 'access-rule' || t.type === 'reward')
        .filter(t => {
          if (
            t.attributes.access_rule_type === 'public' ||
            t.attributes.access_rule_type === 'patrons'
          )
            return true;
          else if (t.attributes.title) return true;
          return false;
        })
        .forEach(t => {
          let value = t.id;
          if (t.type === 'reward') {
            const found = tierJson.included.find(relation => {
              if (relation.attributes.access_rule_type === 'tier') {
                const relationship = _.get(relation, 'relationships.tier.data.id', null);
                if (value === relationship) return true;
              }
            });

            if (found) {
              value = found.id;
            }
          }
          const tierObj: Folder = {
            value,
            label: t.attributes.title || t.attributes.access_rule_type,
          };
          if (t.type === 'access-rule') {
            if (tierObj.label === 'patrons') tierObj.label = 'Patrons Only';
            else if (tierObj.label === 'public') tierObj.label = 'Public';
            tiers.push(tierObj);
          } else {
            customTiers.children.push(tierObj);
          }
        });

      tiers.push(customTiers);
      this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, tiers);
    }
  }

  private async getCSRF(profileId: string): Promise<string> {
    const page = await Http.get<string>(`${this.BASE_URL}/post`, profileId);
    const match = page.body.match(/csrfSignature = "(.*?)"/);
    if (!match) {
      throw new Error('No CSRF Token found.');
    }
    return match[1];
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(200) };
  }

  parseDescription(text: string) {
    if (!text) return '';
    // encode html
    text = text.replace(/[\u00A0-\u9999<>&](?!#)/gim, i => {
      return '&#' + i.charCodeAt(0) + ';';
    });

    // decode html
    // this converts html tags back, but not entities which could cause patreon to break
    text = text.replace(/&#([0-9]{1,3});/gi, (match, num) => {
      return String.fromCharCode(parseInt(num));
    });

    return text
      .replace(/\n/g, '')
      .replace(/<p/gm, '<div')
      .replace(/<\/p>/gm, '</div>')
      .replace(/(<s>|<\/s>)/g, '')
      .replace(/<hr\s{0,1}\/{0,1}>/g, '<br>');
  }

  private getPostType(type: FileSubmissionType, alt: boolean = false): any {
    if (alt) {
      if (type === FileSubmissionType.IMAGE) return 'image_file';
      if (type === FileSubmissionType.AUDIO) return 'audio_embed';
      if (type === FileSubmissionType.TEXT) return 'text_only';
    } else {
      if (type === FileSubmissionType.IMAGE) return 'image_file';
      if (type === FileSubmissionType.AUDIO) return 'audio_file';
      if (type === FileSubmissionType.TEXT) return 'text_only';
    }

    return 'image_file';
  }

  private async createPost(
    profileId: string,
    csrf: string,
    data: object,
  ): Promise<{ data: any; link: any }> {
    const create = await BrowserWindowUtil.post<string>(
      profileId,
      `${this.BASE_URL}/api/posts?fields[post]=post_type%2Cpost_metadata&json-api-version=1.0&include=[]`,
      {
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'application/vnd.api+json',
        Origin: 'https://www.patreon.com',
        Pragma: 'no-cache',
        Referer: 'https://www.patreon.com/posts/new',
        'X-CSRF-Signature': csrf,
      },
      data,
    );

    return JSON.parse(create);
  }

  private async finalizePost(
    profileId: string,
    id: string,
    csrf: string,
    data: object,
  ): Promise<{ body: string; status: number }> {
    const cmd = `
    var data = ${JSON.stringify(data)};
    var xhr = new XMLHttpRequest();
    xhr.open('PATCH', '/api/posts/${id}?json-api-version=1.0', false);
    xhr.setRequestHeader('X-CSRF-Signature', '${csrf}');
    xhr.setRequestHeader("Content-Type", "application/vnd.api+json");
    xhr.send(JSON.stringify(data));
    var body = xhr.response;
    Object.assign({}, { body: body, status: xhr.status })`;
    return BrowserWindowUtil.runScripOnPage<{ body: string; status: number }>(
      profileId,
      `${this.BASE_URL}/posts/${id}/edit`,
      cmd,
    );
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, PatreonNotificationOptions>,
  ): Promise<PostResponse> {
    const csrf = await this.getCSRF(data.part.accountId);
    const createData = {
      data: {
        type: 'post',
        attributes: {
          post_type: 'text_only',
        },
      },
    };

    const create = await this.createPost(data.part.accountId, csrf, createData);
    const link = create.data.id;

    // Tags
    const formattedTags = this.formatTags(data.tags);
    const relationshipTags = formattedTags.map(tag => {
      return {
        id: tag.id,
        type: tag.type,
      };
    });

    const { options } = data;
    const accessRules: any[] = options.tiers.map(tier => {
      return { type: 'access-rule', id: tier };
    });

    const attributes: any = {
      content: data.description,
      post_type: 'text_only',
      is_paid: options.charge ? 'true' : 'false',
      title: data.title,
      teaser_text: '',
      post_metadata: {},
      tags: { publish: true },
    };

    const relationships = {
      post_tag: {
        data: relationshipTags.length > 0 ? relationshipTags[0] : {},
      },
      user_defined_tags: {
        data: relationshipTags,
      },
      access_rule: {
        data: accessRules[accessRules.length - 1],
      },
      access_rules: {
        data: accessRules,
      },
    };

    const form = {
      data: {
        attributes,
        relationships,
        type: 'post',
      },
      included: formattedTags,
    };

    accessRules.forEach(rule => form.included.push(rule));

    this.checkCancelled(cancellationToken);
    const post = await this.finalizePost(data.part.accountId, link, csrf, form);
    try {
      const json = JSON.parse(post.body);
      if (!json.errors) {
        return this.createPostResponse({ source: `${this.BASE_URL}/posts/${link}` });
      }
    } catch {}

    return Promise.reject(this.createPostResponse({ additionalInfo: post }));
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<PatreonFileOptions>,
  ): Promise<PostResponse> {
    return null;
  }

  formatTags(tags: string[]): any {
    tags = tags.filter(tag => tag.length <= 25);
    return tags
      .map(tag => {
        return {
          type: 'post_tag',
          id: `user_defined;${tag}`,
          attributes: {
            value: tag,
            cardinality: 1,
          },
        };
      })
      .slice(0, 50);
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<PatreonFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const options = submissionPart.data;
    if (options.tiers && options.tiers.length) {
      const folders = this.getAccountInfo(submissionPart.accountId, GenericAccountProp.FOLDERS);
      options.tiers.forEach(tier => {
        if (!WebsiteValidator.folderIdExists(tier, folders)) {
          problems.push(`Access Tier could not be found: ${tier}`);
        }
      });
    } else {
      warnings.push('Post will be made public to all.');
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      const maxMB = 200;
      if (FileSize.MBtoBytes(maxMB) < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`Patreon limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<PatreonNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems = [];
    const warnings = [];

    const options = submissionPart.data;
    if (options.tiers && options.tiers.length) {
      const folders = this.getAccountInfo(submissionPart.accountId, GenericAccountProp.FOLDERS);
      options.tiers.forEach(tier => {
        if (!WebsiteValidator.folderIdExists(tier, folders)) {
          problems.push(`Access Tier could not be found: ${tier}`);
        }
      });
    } else {
      warnings.push('Post will be made public to all.');
    }

    return { problems, warnings };
  }
}
