import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { BBCodeParser } from 'src/description-parsing/bbcode/bbcode.parser';
import { UsernameParser } from 'src/description-parsing/miscellaneous/username.parser';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import Http from 'src/http/http.util';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
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
import FileSize from 'src/utils/filesize.util';
import FormContent from 'src/utils/form-content.util';
import HtmlParserUtil from 'src/utils/html-parser.util';
import WebsiteValidator from 'src/utils/website-validator.util';
import { Folder } from '../interfaces/folder.interface';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { FurAffinityDefaultFileOptions, FurAffinityDefaultNotificationOptions } from './fur-affinity.defaults';
import { FurAffinityFileOptions, FurAffinityNotificationOptions } from './fur-affinity.interface';
import _ = require('lodash');

@Injectable()
export class FurAffinity extends Website {
  readonly BASE_URL = 'https://www.furaffinity.net';
  readonly waitBetweenPostsInterval = 50000;
  readonly fileSubmissionOptions = FurAffinityDefaultFileOptions;
  readonly notificationSubmissionOptions = FurAffinityDefaultNotificationOptions;
  readonly defaultDescriptionParser = BBCodeParser.parse;
  readonly usernameShortcuts = [
    {
      key: 'fa',
      url: 'https://www.furaffinity.net/user/$1',
    },
  ];

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
    const res = await Http.get<string>(`${this.BASE_URL}/controls/submissions`, data._id);
    if (res.body.includes('logout-link')) {
      status.loggedIn = true;
      const $ = cheerio.load(res.body);
      status.username = $('.loggedin_user_avatar').attr('alt');
      this.getFolders(data._id, $);
    }
    return status;
  }

  private getFolders(profileId: string, $: CheerioStatic) {
    const folders: Folder[] = [];
    const flatFolders: Folder[] = [];

    $('select[name=assign_folder_id]')
      .children()
      .each((i, el) => {
        const $el = $(el);
        if (el.name === 'option') {
          if ($el.attr('value') === '0') return;
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

    this.storeAccountInformation(profileId, 'folders', folders);
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
    const page = await Http.get<string>(`${this.BASE_URL}/controls/journal`, data.part.accountId);
    this.verifyResponse(page, 'Check control');
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
    const post = await Http.post<string>(
      `${this.BASE_URL}/controls/journal/`,
      data.part.accountId,
      {
        type: 'multipart',
        data: form,
      },
    );

    this.verifyResponse(post, 'Post');
    if (post.body.includes('journal-title')) {
      return this.createPostResponse({ source: post.returnUrl });
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

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<FurAffinityFileOptions>,
  ): Promise<PostResponse> {
    const part1 = await Http.post<string>(`${this.BASE_URL}/submit/`, data.part.accountId, {
      type: 'form',
      data: {
        part: '2',
        submission_type: this.getContentType(data.primary.type),
      },
      headers: {
        Host: 'www.furaffinity.net',
        Referer: 'https://www.furaffinity.net/submit/',
      },
    });

    this.checkCancelled(cancellationToken);
    this.verifyResponse(part1, 'Part 1');
    if (part1.body.includes('Flood protection')) {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: part1.body,
          message: 'Encountered Flood Protection',
        }),
      );
    }

    const part2Form = {
      key: HtmlParserUtil.getInputValue(part1.body.split('action="/submit/"').pop(), 'key'),
      part: '3',
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
    const part2 = await Http.post<string>(`${this.BASE_URL}/submit/`, data.part.accountId, {
      type: 'multipart',
      data: part2Form,
      headers: {
        Host: 'www.furaffinity.net',
        Referer: 'https://www.furaffinity.net/submit/',
      },
    });

    this.verifyResponse(part2, 'Part 2');
    if (part2.body.includes('Flood protection')) {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: part2.body,
          message: 'Encountered Flood Protection',
        }),
      );
    }

    if (part2.body.includes('pageid-error') || !part2.body.includes('pageid-submit-finalize')) {
      return Promise.reject(this.createPostResponse({ additionalInfo: part2.body }));
    }

    const { options } = data;
    const form: any = {
      part: '5',
      key: HtmlParserUtil.getInputValue(part2.body.split('action="/submit/"').pop(), 'key'),
      title: data.title,
      keywords: this.formatTags(data.tags),
      message: data.description,
      submission_type: this.getContentType(data.primary.type),
      rating: this.getRating(data.rating),
      cat_duplicate: '',
      create_folder_name: '',
      cat: options.category,
      atype: options.theme,
      species: options.species,
      gender: options.gender,
    };

    if (data.primary.type !== FileSubmissionType.IMAGE) {
      delete form.cat;
      form.cat_duplicate = this.getContentCategory(data.primary.type);
    }

    if (options.disableComments) form.lock_comments = 'on';
    if (options.scraps) form.scrap = '1';

    if (options.folders) {
      form['folder_ids[]'] = options.folders;
    }

    this.checkCancelled(cancellationToken);
    const post = await Http.post<string>(`${this.BASE_URL}/submit/`, data.part.accountId, {
      type: 'multipart',
      data: form,
      requestOptions: { qsStringifyOptions: { arrayFormat: 'repeat' } },
    });

    this.verifyResponse(post, 'Finalize');

    const { body } = post;

    if (body.includes('CAPTCHA verification error')) {
      return Promise.reject(
        this.createPostResponse({ message: 'You must have 10+ posts on your account first' }),
      );
    }

    if (body.includes('pageid-submit-finalize')) {
      return Promise.reject(this.createPostResponse({ additionalInfo: body }));
    }

    if (post.returnUrl.includes('/submit')) {
      return Promise.reject(
        this.createPostResponse({ message: 'Something went wrong', additionalInfo: body }),
      );
    }

    try {
      if (data.primary.type === FileSubmissionType.IMAGE && options.reupload) {
        const submissionId = HtmlParserUtil.getInputValue(body, 'submission_ids[]');
        await Http.post(
          `${this.BASE_URL}/controls/submissions/changesubmission/${submissionId}`,
          data.part.accountId,
          {
            type: 'multipart',
            data: {
              update: 'yes', // always seems to be 'yes'
              newsubmission: data.primary.file,
            },
          },
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      return this.createPostResponse({ source: post.returnUrl });
    }
  }

  formatTags(tags: string[]): string {
    const maxLength = 250;
    tags = super.parseTags(tags).map(tag => tag.replace(/(\/|\\)/gm, '_'));
    const filteredTags = tags.filter(tag => tag.length >= 3);
    let tagString = filteredTags.join(' ').trim();
    if (tagString.length > maxLength) {
      let fitTags = [];
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
      FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).join(' ').length > 250
    ) {
      warnings.push('Tags will be truncated to a length of 250 characters.');
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
        problems.push(
          `Does not support file format: (${submission.primary.name}) ${submission.primary.mimetype}.`,
        );
        problems.push('A fallback file is required.');
      } else if (submission.primary.type === FileSubmissionType.TEXT && submission.fallback) {
        warnings.push('The fallback text will be used.');
      } else {
        problems.push(
          `Does not support file format: (${submission.primary.name}) ${submission.primary.mimetype}.`,
        );
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
