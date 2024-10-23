import { Injectable } from '@nestjs/common';
import cheerio from 'cheerio';
import {
  AryionFileOptions,
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PostResponse,
  SubmissionPart,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { UsernameParser } from 'src/server/description-parsing/miscellaneous/username.parser';
import { BBCodeParser } from 'src/server/description-parsing/bbcode/bbcode.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class Aryion extends Website {
  readonly BASE_URL = 'https://aryion.com';
  readonly MAX_CHARS: number = undefined; // No limit
  readonly defaultDescriptionParser = BBCodeParser.parse;
  readonly usernameShortcuts = [
    {
      key: 'ar',
      url: 'https://aryion.com/g4/user/$1',
    },
  ];
  readonly acceptsFiles = [
    'jpg',
    'jpeg',
    'gif',
    'png',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'swf',
    'vsd',
    'txt',
    'rtf',
    'avi',
    'mpg',
    'mpeg',
    'flv',
    'mp4',
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(`${this.BASE_URL}/g4/treeview.php`, data._id);
    if (res.body.includes('user-link') && !res.body.includes('Login to read messages')) {
      status.loggedIn = true;
      const $ = cheerio.load(res.body);
      status.username = $('.user-link').text();
      this.getFolders(data._id, $);
    }
    return status;
  }

  private getFolders(profileId: string, $: cheerio.Root) {
    const folders: Folder[] = [];
    $('.treeview')
      .children()
      .each((i, e) => {
        const myTree: Folder[] = [];
        this.searchFolderTree($, e, myTree);
        folders.push(...myTree);
      });

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, folders);
  }

  private searchFolderTree($: cheerio.Root, el: cheerio.Element, parent: Folder[]) {
    const me: Folder = {
      value: undefined,
      label: '',
    };
    $(el)
      .children()
      .each((i, n: any) => {
        const node = $(n);
        if (n.name === 'span') {
          me.value = node.attr('data-tid');
          me.label = node.text();
          parent.push(me);
        } else if (n.name === 'ul') {
          me.children = [];
          node.children().each((j, c) => this.searchFolderTree($, c, me.children));
        }
      });
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(20) };
  }

  preparseDescription(text: string) {
    return UsernameParser.replaceText(text, 'ar', ':icon$1:');
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<AryionFileOptions>,
  ): Promise<PostResponse> {
    let postFile = data.primary.file;
    if (data.primary.type === FileSubmissionType.TEXT) {
      if (!WebsiteValidator.supportsFileType(data.submission.primary, this.acceptsFiles)) {
        postFile = data.fallback;
      }
    }

    const form: any = {
      action: 'new-item',
      parentid: data.options.folder,
      MAX_FILE_SIZE: '78643200',
      title: data.title,
      file: postFile,
      thumb: data.thumbnail,
      desc: data.description,
      tags: this.formatTags(data.tags)
        .filter(f => !f.match(/^vore$/i))
        .filter(f => !f.match(/^non-vore$/i))
        .join('\n'),
      'reqtag[]': data.options.requiredTag === '1' ? 'Non-Vore' : '',
      view_perm: data.options.viewPermissions,
      comment_perm: data.options.commentPermissions,
      tag_perm: data.options.tagPermissions, // NOTE: broken
      scrap: data.options.scraps ? 'on' : '',
    };

    this.checkCancelled(cancellationToken);
    const post = await Http.post<string>(
      `${this.BASE_URL}/g4/itemaction.php`,
      data.part.accountId,
      {
        type: 'multipart',
        data: form,
      },
    );

    this.verifyResponse(post, 'Verify Post');
    try {
      const json = JSON.parse(post.body.replace(/(<textarea>|<\/textarea>)/g, ''));
      if (json.id) {
        return this.createPostResponse({ source: `${this.BASE_URL}${json.url}` });
      }
    } catch (err) {}
    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<AryionFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
    description: string,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (!submissionPart.data.folder || !submissionPart.data.folder.length) {
      problems.push('No folder selected.');
    } else {
      if (
        !WebsiteValidator.folderIdExists(
          submissionPart.data.folder.pop(),
          this.getAccountInfo(submissionPart.accountId, GenericAccountProp.FOLDERS),
        )
      ) {
        problems.push(`Folder (${submissionPart.data.folder}) not found.`);
      }
    }

    if (!submissionPart.data.requiredTag) {
      problems.push('No required tag selected.');
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      if (submission.primary.type === FileSubmissionType.TEXT && !submission.fallback) {
        problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        problems.push('A fallback file is required.');
      } else if (submission.primary.type === FileSubmissionType.TEXT && submission.fallback) {
        warnings.push('The fallback text will be used.');
      } else {
        problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
      }
    }

    const { type, size, name } = submission.primary;
    const maxMB: number = 20;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Aryion limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
