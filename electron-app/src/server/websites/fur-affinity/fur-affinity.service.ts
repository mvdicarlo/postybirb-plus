import { Injectable } from '@nestjs/common';
import cheerio from 'cheerio';
import _ from 'lodash';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  FurAffinityFileOptions,
  FurAffinityNotificationOptions,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { BBCodeParser } from 'src/server/description-parsing/bbcode/bbcode.parser';
import { UsernameParser } from 'src/server/description-parsing/miscellaneous/username.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import HtmlParserUtil from 'src/server/utils/html-parser.util';
import { HttpExperimental } from 'src/server/utils/http-experimental';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class FurAffinity extends Website {
  readonly BASE_URL = 'https://www.furaffinity.net';
  readonly waitBetweenPostsInterval = 70000;
  readonly MAX_CHARS: number = undefined; // No limit
  readonly defaultDescriptionParser = BBCodeParser.parse;
  readonly usernameShortcuts = [
    {
      key: 'fa',
      url: 'https://www.furaffinity.net/user/$1',
    },
  ];

  private readonly MAX_TAGS_LENGTH = 500;

  readonly acceptsFiles = [
    'jpg',
    'gif',
    'png',
    'jpeg',
    'jpg',
    'swf',
    'doc',
    'docx',
    'rtf',
    'txt',
    'pdf',
    'odt',
    'mid',
    'wav',
    'mp3',
    'mpeg',
    'mpg',
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await HttpExperimental.get<string>(`${this.BASE_URL}/controls/submissions`, {
      partition: data._id,
    });
    if (res.body.includes('logout-link')) {
      status.loggedIn = true;
      const $ = cheerio.load(res.body);
      status.username = $('.loggedin_user_avatar').attr('alt');
      this.getFolders(data._id, $);
    }
    return status;
  }

  private getFolders(profileId: string, $: cheerio.Root) {
    const folders: Folder[] = [];
    const flatFolders: Folder[] = [];

    $('select[name=assign_folder_id]')
      .children()
      .each((i, el: any) => {
        const $el = $(el);
        if (el.name === 'option') {
          if ($el.attr('value') === '0') {
            return;
          }
          const folder: Folder = { value: $el.attr('value'), label: $el.text() };
          folders.push(folder);
          flatFolders.push(folder);
        } else {
          const optgroup: Folder = {
            label: $el.attr('label'),
            children: [],
          };
          $el.children().each((i, opt) => {
            const $opt = $(opt);
            const f: Folder = {
              value: $opt.attr('value'),
              label: $opt.text(),
            };
            optgroup.children.push(f);
            flatFolders.push(f);
          });
          folders.push(optgroup);
        }
      });

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, folders);
    this.storeAccountInformation(profileId, 'flat_folders', flatFolders);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(10) };
  }

  preparseDescription(text: string) {
    return UsernameParser.replaceText(text, 'fa', ':icon$1:', (str: string) =>
      str.replace(/_/g, ''),
    );
  }

  parseDescription(text: string) {
    return super.parseDescription(text).replace(/\[hr\]/g, '-----');
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, FurAffinityNotificationOptions>,
  ): Promise<PostResponse> {
    const page = await HttpExperimental.get<string>(`${this.BASE_URL}/controls/journal`, {
      partition: data.part.accountId,
    });
    this.verifyResponseExperimental(page, 'Check control');
    const form: any = {
      key: HtmlParserUtil.getInputValue(
        page.body.split('action="/controls/journal/"').pop(),
        'key',
      ),
      message: data.description,
      subject: data.title,
      submit: 'Create / Update Journal',
      id: '',
      do: 'update',
    };

    if (data.options.feature) {
      form.make_featured = 'on';
    }

    this.checkCancelled(cancellationToken);
    const post = await HttpExperimental.post<string>(`${this.BASE_URL}/controls/journal/`, {
      partition: data.part.accountId,
      type: 'multipart',
      data: form,
    });

    this.verifyResponseExperimental(post, 'Post');
    if (post.body.includes('journal-title')) {
      return this.createPostResponse({ source: post.responseUrl });
    }

    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  private getContentType(type: FileSubmissionType) {
    switch (type) {
      case FileSubmissionType.TEXT:
        return 'story';
      case FileSubmissionType.VIDEO:
        return 'flash';
      case FileSubmissionType.AUDIO:
        return 'music';
      case FileSubmissionType.IMAGE:
      default:
        return 'submission';
    }
  }

  private getContentCategory(type: FileSubmissionType) {
    switch (type) {
      case FileSubmissionType.TEXT:
        return '13';
      case FileSubmissionType.VIDEO:
        return '7';
      case FileSubmissionType.AUDIO:
        return '16';
      case FileSubmissionType.IMAGE:
      default:
        return '1';
    }
  }

  private getRating(rating: SubmissionRating) {
    switch (rating) {
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return '1';
      case SubmissionRating.MATURE:
        return '2';
      case SubmissionRating.GENERAL:
      default:
        return '0';
    }
  }

  private processForError(body: string): string | undefined {
    if (body.includes('redirect-message')) {
      const $ = cheerio.load(body);
      let msg = $('.redirect-message').first().text();

      if (msg?.includes('CAPTCHA')) {
        msg =
          'You need at least 11+ posts on your account before you can use PostyBirb with Fur Affinity.';
      }

      return msg;
    }

    return undefined;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<FurAffinityFileOptions>,
  ): Promise<PostResponse> {
    const part1 = await HttpExperimental.get<string>(`${this.BASE_URL}/submit/`, {
      partition: data.part.accountId,
      headers: {
        Referer: 'https://www.furaffinity.net/submit/',
      },
    });

    this.checkCancelled(cancellationToken);
    this.verifyResponseExperimental(part1, 'Part 1');

    let err = this.processForError(part1.body);
    if (err) {
      return Promise.reject(this.createPostResponse({ message: err, additionalInfo: part1.body }));
    }

    const part2Form = {
      key: HtmlParserUtil.getInputValue(part1.body.split('upload_form').pop(), 'key'),
      submission: data.primary.file,
      thumbnail: data.thumbnail,
      submission_type: this.getContentType(data.primary.type),
    };

    if (data.primary.type === FileSubmissionType.TEXT) {
      if (!WebsiteValidator.supportsFileType(data.submission.primary, this.acceptsFiles)) {
        part2Form.submission = data.fallback;
      }
    }

    this.checkCancelled(cancellationToken);
    const part2 = await HttpExperimental.post<string>(`${this.BASE_URL}/submit/upload`, {
      partition: data.part.accountId,
      type: 'multipart',
      data: part2Form,
      headers: {
        Referer: 'https://www.furaffinity.net/submit',
      },
    });

    this.verifyResponseExperimental(part2, 'Part 2');
    err = this.processForError(part2.body);
    if (err) {
      return Promise.reject(this.createPostResponse({ message: err, additionalInfo: part2.body }));
    }

    const { options } = data;
    const form: any = {
      key: HtmlParserUtil.getInputValue(part2.body.split('"submit-finalize"').pop(), 'key'),
      title: data.title,
      keywords: this.getFormTags(data.tags),
      message: data.description,
      rating: this.getRating(data.rating),
      create_folder_name: '',
      cat: options.category,
      atype: options.theme,
      species: options.species,
      gender: options.gender,
    };

    if (data.primary.type !== FileSubmissionType.IMAGE) {
      form.cat = this.getContentCategory(data.primary.type);
    }

    if (options.disableComments) {
      form.lock_comments = 'on';
    }
    if (options.scraps) {
      form.scrap = '1';
    }

    if (options.folders) {
      form['folder_ids'] = options.folders;
    }

    this.checkCancelled(cancellationToken);
    const post = await HttpExperimental.post<string>(`${this.BASE_URL}/submit/finalize`, {
      partition: data.part.accountId,
      type: 'urlencoded',
      data: form,
    });

    this.verifyResponseExperimental(post, 'Finalize');

    const { body } = post;

    if (!post.responseUrl.includes('?upload-successful')) {
      err = this.processForError(body);
      if (err) {
        return Promise.reject(this.createPostResponse({ message: err, additionalInfo: body }));
      }

      return Promise.reject(
        this.createPostResponse({ message: 'Something went wrong', additionalInfo: body }),
      );
    }

    return this.createPostResponse({ source: post.responseUrl.replace('?upload-successful', '') });
  }

  getFormTags(tags: string[]): string {
    const maxLength = this.MAX_TAGS_LENGTH;
    tags = super.parseTags(tags).map(tag => tag.replace(/(\/|\\)/gm, '_'));
    const filteredTags = tags.filter(tag => tag.length >= 3);
    let tagString = filteredTags.join(' ').trim();
    if (tagString.length > maxLength) {
      const fitTags = [];
      filteredTags.forEach(tag => {
        if (fitTags.join(' ').length + 1 + tag.length < maxLength) {
          fitTags.push(tag);
        }
      });
      tagString = fitTags.join(' ');
    }

    return tagString.length > maxLength ? tagString.substring(0, maxLength) : tagString;
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<FurAffinityFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (
      FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).join(' ').length >
      this.MAX_TAGS_LENGTH
    ) {
      warnings.push(`Tags will be truncated to a length of ${this.MAX_TAGS_LENGTH} characters.`);
    }

    if (submissionPart.data.folders) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        'flat_folders',
        [],
      );
      submissionPart.data.folders.forEach(folder => {
        if (!folders.find(f => f.value === folder)) {
          warnings.push(`Folder (${folder}) not found.`);
        }
      });
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
    const maxMB: number = 10;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Fur Affinity limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
