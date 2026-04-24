import { Injectable } from '@nestjs/common';
import parse from 'node-html-parser';
import { parse as parseFileName } from 'path';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PatreonFileOptions,
  PatreonNotificationOptions,
  PostResponse,
  Submission,
  SubmissionPart,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import {
  FilePostData,
  PostFile,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import { HttpExperimental } from 'src/server/utils/http-experimental';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { v4 } from 'uuid';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { PatreonDescriptionConverter } from './patreon-description-converter';

// Patreon API response types
interface PatreonCampaignResponse {
  data: {
    attributes: {
      name: string;
      currency: string;
    };
  };
  included: Array<{
    type: string;
    id: string;
    attributes: any;
    relationships?: any;
  }>;
}

interface PatreonMediaUploadResponse {
  data: {
    id: string;
    attributes: {
      state: string;
      upload_parameters: Record<string, string>;
      upload_url: string;
      media_type: string;
    };
  };
}

interface PatreonCollectionResponse {
  data: Array<{
    id: string;
    attributes: {
      title: string;
    };
  }>;
}

type PatreonTagSegment = Array<{
  type: 'post_tag';
  id: string;
  attributes: {
    value: string;
    cardinality: 1;
  };
}>;

type PatreonAccessRuleSegment = Array<{
  type: 'access-rule';
  id: string;
  attributes: object;
}>;

/*
 * Developer note:
 * Backported from modern-patreon.ts implementation.
 * Uses HttpExperimental for all API calls instead of BrowserWindow XHR hacks.
 * Sends content_json_string (TipTap JSON) alongside HTML content.
 */

@Injectable()
export class Patreon extends Website {
  readonly BASE_URL = 'https://www.patreon.com';
  readonly acceptsAdditionalFiles = true;
  readonly MAX_CHARS: number = undefined; // No Limit
  readonly refreshBeforePost: boolean = true;
  readonly waitBetweenPostsInterval = 90_000;
  readonly enableAdvertisement: boolean = false;
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

    try {
      // Fetch the membership page to get CSRF token
      const membershipPage = await HttpExperimental.get<string>(`${this.BASE_URL}/membership`, {
        partition: data._id,
      });

      const $page = parse(typeof membershipPage.body === 'string' ? membershipPage.body : '');
      const csrf = $page.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      if (!csrf) {
        return status;
      }

      this.storeAccountInformation(data._id, 'csrf', csrf);

      // Fetch badges to find campaign ID
      const badgesResult = await HttpExperimental.get<{
        data: Array<{ id: string; type: string; attributes: object }>;
      }>(
        `${this.BASE_URL}/api/badges?json-api-version=1.0&json-api-use-default-includes=false&include=[]`,
        { partition: data._id },
      );

      const campaignBadge = badgesResult.body.data?.find(badge => badge.id.includes('campaign'));

      if (!campaignBadge) {
        return status;
      }

      const campaignId = campaignBadge.id.split(':')[1];
      this.storeAccountInformation(data._id, 'campaignId', campaignId);

      // Fetch campaign details for tiers
      const campaignQueryString =
        '?fields[rewardItem]=title%2Cdescription%2Coffer_id%2Citem_type%2Cis_deleted%2Cis_ended%2Cis_published&fields[accessRule]=access_rule_type%2Camount_cents%2Cpost_count&include=post_aggregation%2Ccreator.campaign%2Ccreator.pledge_to_current_user.null%2Cconnected_socials%2Ccurrent_user_pledge.reward.null%2Ccurrent_user_pledge.campaign.null%2Crewards.items.null%2Crewards.cadence_options.null%2Crss_auth_token%2Caccess_rules.tier.null%2Cactive_offer.rewards.null%2Cscheduled_offer.rewards.null%2Ccreator.pledges.campaign.null%2Creward_items.template%2Crewards.null%2Crewards.reward_recommendations%2Cthanks_embed%2Cthanks_msg&json-api-version=1.0&json-api-use-default-includes=false';
      const campaignResult = await HttpExperimental.get<PatreonCampaignResponse>(
        `${this.BASE_URL}/api/campaigns/${campaignId}${campaignQueryString}`,
        { partition: data._id },
      );

      if (campaignResult.body?.data) {
        const username = campaignResult.body.data.attributes.name;
        status.loggedIn = true;
        status.username = username;
        this.parseTiers(data._id, campaignResult.body);
        await this.loadCollections(data._id, campaignId, csrf);
      }
    } catch (err) {
      this.logger.error('Patreon login check failed', err);
    }

    return status;
  }

  private parseTiers(profileId: string, campaign: PatreonCampaignResponse): void {
    const { included } = campaign;
    if (!included) return;

    const rewards = included.filter(item => item.type === 'reward');
    const accessRules = included.filter(item => item.type === 'access-rule');
    const tierCosts: Record<string, number> = {};

    const tiers: Folder[] = accessRules
      .map(accessRule => {
        const { id, attributes, relationships } = accessRule;
        let label: string;
        let cost = 0;

        if (attributes.access_rule_type === 'public') {
          label = 'Everyone';
        }

        if (attributes.access_rule_type === 'patrons') {
          label = 'Patrons Only';
          cost = 1; // Sort above free
        }

        if (attributes.access_rule_type === 'tier') {
          const rewardTier = rewards.find(reward => reward.id === relationships?.tier?.data?.id);
          if (rewardTier) {
            cost = rewardTier.attributes.amount_cents || 0;
            const currency = rewardTier.attributes.currency || 'USD';
            label = `${
              rewardTier.attributes.title || rewardTier.attributes.description || 'Untitled Reward'
            } (${(cost / 100).toFixed(2)} ${currency})`;
          }
        }

        tierCosts[id] = cost;

        return {
          value: id,
          label,
        } as Folder;
      })
      .filter(tier => !!tier.label)
      .sort((a, b) => (tierCosts[a.value] || 0) - (tierCosts[b.value] || 0));

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, tiers);
    this.storeAccountInformation(profileId, 'tierCosts', tierCosts);
  }

  private async loadCollections(
    profileId: string,
    campaignId: string,
    csrf: string,
  ): Promise<void> {
    try {
      const collectionRes = await HttpExperimental.get<PatreonCollectionResponse>(
        `${this.BASE_URL}/api/collection?filter[campaign_id]=${campaignId}&filter[must_contain_at_least_one_published_post]=false&json-api-version=1.0&json-api-use-default-includes=false`,
        {
          partition: profileId,
          headers: {
            'X-Csrf-Signature': csrf,
          },
        },
      );

      if (collectionRes.statusCode >= 400 && typeof collectionRes.body === 'string') {
        this.storeAccountInformation(profileId, 'collections', []);
        return;
      }

      const collections: Folder[] = collectionRes.body.data.map(c => ({
        label: c.attributes.title,
        value: c.id,
      }));
      this.storeAccountInformation(profileId, 'collections', collections);
    } catch (err) {
      this.logger.error('Failed to load Patreon collections', err);
      this.storeAccountInformation(profileId, 'collections', []);
    }
  }

  private async getCSRF(profileId: string): Promise<string> {
    const page = await HttpExperimental.get<string>(`${this.BASE_URL}/membership`, {
      partition: profileId,
    });

    const root = parse(typeof page.body === 'string' ? page.body : '');
    const csrf = root.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!csrf) {
      // Fall back to stored CSRF
      const storedCsrf = this.getAccountInfo(profileId, 'csrf');
      if (storedCsrf) {
        return storedCsrf;
      }
      throw new Error('No CSRF Token found.');
    }
    this.storeAccountInformation(profileId, 'csrf', csrf);
    return csrf;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(200) };
  }

  parseDescription(text: string) {
    if (!text) {
      return '';
    }
    // Minimal processing — content_json_string is the primary format now
    return text.replace(/\n/g, '');
  }

  private getPostType(type: FileSubmissionType): string {
    switch (type) {
      case FileSubmissionType.AUDIO:
        return 'audio_embed';
      case FileSubmissionType.IMAGE:
        return 'image_file';
      case FileSubmissionType.VIDEO:
        return 'video';
      case FileSubmissionType.TEXT:
      default:
        return 'text_only';
    }
  }

  private async createPost(
    profileId: string,
    csrf: string,
  ): Promise<{ data: { id: string; type: string; attributes: any }; links: { self: string } }> {
    const res = await HttpExperimental.post<{
      data: { id: string; type: string; attributes: any };
      links: { self: string };
    }>(
      `${this.BASE_URL}/api/posts?fields[post]=post_type%2Cpost_metadata&include=drop&json-api-version=1.0&json-api-use-default-includes=false`,
      {
        partition: profileId,
        type: 'json',
        data: {
          data: {
            type: 'post',
            attributes: {
              post_type: 'text_only',
            },
          },
        },
        headers: {
          'X-Csrf-Signature': csrf,
        },
      },
    );

    this.verifyResponseExperimental(res, 'Create Post');
    return res.body;
  }

  private async finalizePost(
    profileId: string,
    id: string,
    csrf: string,
    data: object,
  ): Promise<void> {
    const res = await HttpExperimental.patch(
      `${this.BASE_URL}/api/posts/${id}?json-api-version=1.0&json-api-use-default-includes=false&include=[]`,
      {
        partition: profileId,
        type: 'json',
        data: data as Record<string, unknown>,
        headers: {
          'X-Csrf-Signature': csrf,
        },
      },
    );

    this.verifyResponseExperimental(res, 'Finalize Post');
  }

  private toUTCISO(date: Date | string): string {
    let d: Date = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('.').shift();
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getMediaType(type: FileSubmissionType): string | undefined {
    switch (type) {
      case FileSubmissionType.AUDIO:
        return 'audio';
      case FileSubmissionType.IMAGE:
        return 'image';
      case FileSubmissionType.VIDEO:
        return 'video';
      default:
        return undefined;
    }
  }

  private async uploadMedia(
    postId: string,
    file: PostFile,
    fileType: FileSubmissionType,
    asAttachment: boolean,
    profileId: string,
    csrf: string,
  ): Promise<PatreonMediaUploadResponse> {
    const { ext } = parseFileName(file.options.filename);
    const fileNameGUID = `${v4().toUpperCase()}${ext}`;

    if (fileType === FileSubmissionType.TEXT || fileType === FileSubmissionType.UNKNOWN) {
      asAttachment = true;
    }

    const mediaData: Record<string, unknown> = {
      data: {
        type: 'media',
        attributes: {
          state: 'pending_upload',
          file_name: fileNameGUID,
          size_bytes: file.value.length,
          owner_id: postId,
          owner_type: 'post',
          owner_relationship: asAttachment
            ? 'attachment'
            : fileType === FileSubmissionType.AUDIO
            ? 'audio'
            : 'main',
          media_type: asAttachment ? undefined : this.getMediaType(fileType),
        },
      },
    };

    // Initialize media upload
    const init = await HttpExperimental.post<PatreonMediaUploadResponse>(
      `${this.BASE_URL}/api/media?json-api-version=1.0&json-api-use-default-includes=false&include=[]`,
      {
        partition: profileId,
        type: 'json',
        data: mediaData,
        headers: {
          'X-Csrf-Signature': csrf,
        },
      },
    );

    this.verifyResponseExperimental(init, 'Media Upload Init');

    // Upload to S3 bucket
    const uploadParams = init.body.data.attributes.upload_parameters;
    const uploadUrl = init.body.data.attributes.upload_url;
    const formData: Record<string, any> = {
      ...uploadParams,
      file: {
        value: file.value,
        options: {
          filename: fileNameGUID,
          contentType: file.options.contentType,
        },
      },
    };

    const upload = await HttpExperimental.post(uploadUrl, {
      partition: undefined,
      type: 'multipart',
      data: formData,
    });

    this.verifyResponseExperimental(upload, 'Bucket Upload');

    // Poll for ready state
    const timeout = Date.now() + 90_000;
    while (Date.now() <= timeout) {
      const state = await HttpExperimental.get<PatreonMediaUploadResponse>(
        `${this.BASE_URL}/api/media/${init.body.data.id}?json-api-version=1.0&json-api-use-default-includes=false&include=[]`,
        {
          partition: profileId,
          headers: {
            'X-Csrf-Signature': csrf,
          },
        },
      );

      this.verifyResponseExperimental(state, 'Verify Upload State');

      if (state.body.data.attributes.state === 'ready') {
        return state.body;
      }

      if (state.body.data.attributes.state === 'failed') {
        throw this.createPostResponse({
          message: 'Media upload failed',
          additionalInfo: state.body,
        });
      }

      await this.wait(2000);
    }

    throw this.createPostResponse({
      message: 'Unable to verify media upload state (timeout)',
    });
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, PatreonNotificationOptions>,
  ): Promise<PostResponse> {
    const csrf = await this.getCSRF(data.part.accountId);
    const create = await this.createPost(data.part.accountId, csrf);
    const postId = create.data.id;

    const tags = this.createTagsSegment(data.tags);
    const accessRules = this.createAccessRuleSegment(data.options.tiers || []);

    const form = {
      data: this.createDataSegment(data, tags, accessRules, 'text_only', postId),
      meta: this.createDefaultMetadataSegment(),
      included: [...tags, ...accessRules],
    };

    this.checkCancelled(cancellationToken);
    await this.finalizePost(data.part.accountId, postId, csrf, form);

    return this.createPostResponse({ source: `${this.BASE_URL}/posts/${postId}` });
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<PatreonFileOptions>,
  ): Promise<PostResponse> {
    const csrf = await this.getCSRF(data.part.accountId);
    const create = await this.createPost(data.part.accountId, csrf);
    const postId = create.data.id;

    // Sanitize filenames
    [data.primary.file, data.thumbnail, ...data.additional.map(f => f.file)]
      .filter(f => f)
      .forEach(f => (f.options.filename = f.options.filename.replace(/'/g, '')));

    const uploadedFiles: PatreonMediaUploadResponse[] = [];

    try {
      // Upload thumbnail if applicable (audio always gets thumbnail if available)
      const shouldUploadThumbnail =
        data.primary.type === FileSubmissionType.AUDIO && data.thumbnail;

      if (shouldUploadThumbnail) {
        const thumbUpload = await this.uploadMedia(
          postId,
          data.thumbnail,
          FileSubmissionType.IMAGE,
          false,
          data.part.accountId,
          csrf,
        );
        uploadedFiles.push(thumbUpload);
      }

      // Upload primary file
      const primaryUpload = await this.uploadMedia(
        postId,
        data.primary.file,
        data.primary.type,
        data.options.allAsAttachment,
        data.part.accountId,
        csrf,
      );
      uploadedFiles.push(primaryUpload);

      // Upload additional files
      for (const file of data.additional) {
        const isAdditionalImage =
          data.primary.type === FileSubmissionType.IMAGE && file.type === FileSubmissionType.IMAGE;
        const upload = await this.uploadMedia(
          postId,
          file.file,
          file.type,
          data.options.allAsAttachment || !isAdditionalImage,
          data.part.accountId,
          csrf,
        );
        uploadedFiles.push(upload);
      }
    } catch (err) {
      return Promise.reject(this.createPostResponse({ additionalInfo: err }));
    }

    const tags = this.createTagsSegment(data.tags);
    const accessRules = this.createAccessRuleSegment(data.options.tiers || []);

    const postType = data.options.allAsAttachment
      ? 'text_only'
      : this.getPostType(data.primary.type);

    const imageMediaIds = uploadedFiles
      .filter(f => f.data.attributes.media_type === 'image')
      .map(f => f.data.id);

    const form = {
      data: this.createDataSegment(data, tags, accessRules, postType, postId, imageMediaIds),
      meta: this.createDefaultMetadataSegment(),
      included: [...tags, ...accessRules],
    };

    this.checkCancelled(cancellationToken);
    await this.finalizePost(data.part.accountId, postId, csrf, form);

    return this.createPostResponse({ source: `${this.BASE_URL}/posts/${postId}` });
  }

  private createTagsSegment(tags: string[]): PatreonTagSegment {
    return this.formatTags(tags)
      .map(tag => ({
        type: 'post_tag' as const,
        id: `user_defined;${tag}`,
        attributes: {
          value: tag,
          cardinality: 1 as const,
        },
      }))
      .slice(0, 50);
  }

  private createAccessRuleSegment(tiers: string[]): PatreonAccessRuleSegment {
    return tiers.map(tier => ({
      type: 'access-rule' as const,
      id: `${tier}`,
      attributes: {},
    }));
  }

  private createDefaultMetadataSegment() {
    return {
      auto_save: false,
      send_notifications: true,
    };
  }

  private createDataSegment(
    postData: PostData<any, any>,
    tagSegment: PatreonTagSegment,
    rulesSegment: PatreonAccessRuleSegment,
    postType: string,
    postId: string,
    mediaIds?: string[],
  ) {
    const { options, description, title } = postData;
    const { charge, schedule, teaser, collections } = options;
    const earlyAccess = options.earlyAccess;

    // Determine if any selected tier is a paid tier
    const tierCosts: Record<string, number> =
      this.getAccountInfo(postData.part.accountId, 'tierCosts') || {};
    const selectedTierIds = new Set(rulesSegment.map(rule => rule.id));
    const hasPaidTier = Array.from(selectedTierIds).some(id => (tierCosts[id] || 0) > 0);

    return {
      type: 'post',
      attributes: {
        comments_write_access_level: 'all',
        content: description || '<p></p>',
        is_paid: charge,
        is_monetized: false,
        new_post_email_type: 'preview_only',
        paywall_display: 'post_layout',
        post_type: postType,
        preview_asset_type: 'default',
        teaser_text: teaser ? teaser.slice(0, 140) : undefined,
        thumbnail_position: null,
        title,
        video_preview_start_ms: null,
        video_preview_end_ms: null,
        is_preview_blurred: true,
        allow_preview_in_rss: true,
        scheduled_for: schedule ? this.toUTCISO(schedule) : undefined,
        change_visibility_at: earlyAccess ? this.toUTCISO(earlyAccess) : undefined,
        post_metadata: {
          platform: {},
        },
        tags: {
          publish: !schedule,
        },
        content_json_string: PatreonDescriptionConverter.convert(description || '<p></p>', {
          postId,
          isMonetized: !!charge,
          isPaidAccessSelected: hasPaidTier,
          includePaywall: hasPaidTier,
        }),
      },
      relationships: {
        post_tag: tagSegment.length
          ? {
              data: {
                type: 'post_tag',
                id: tagSegment[tagSegment.length - 1].id,
              },
            }
          : undefined,
        'access-rule': rulesSegment.length
          ? {
              data: {
                type: 'access-rule',
                id: rulesSegment[rulesSegment.length - 1].id,
              },
            }
          : undefined,
        user_defined_tags: {
          data: tagSegment.map(tag => ({
            id: tag.id,
            type: 'post_tag',
          })),
        },
        access_rules: {
          data: rulesSegment.map(rule => ({
            id: rule.id,
            type: 'access-rule',
          })),
        },
        collections: {
          data: collections || [],
        },
      },
    };
  }

  formatTags(tags: string[]): string[] {
    return tags.filter(tag => tag.length <= 25);
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
          problems.push(`Access Tier (${tier}) could not be found.`);
        }
      });
    } else {
      problems.push('Please pick an access tier.');
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
          problems.push(`Access Tier (${tier}) could not be found.`);
        }
      });
    } else {
      problems.push('Please pick an access tier.');
    }

    return { problems, warnings };
  }
}
