import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  HentaiFoundryFileOptions,
  PostResponse,
  Submission,
  SubmissionPart,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { BBCodeParser } from 'src/server/description-parsing/bbcode/bbcode.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import HtmlParserUtil from 'src/server/utils/html-parser.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

import _ from 'lodash';

@Injectable()
export class HentaiFoundry extends Website {
  readonly BASE_URL = 'https://www.hentai-foundry.com';
  readonly MAX_CHARS: number = undefined; // No Limit
  readonly acceptsFiles = ['jpeg', 'jpg', 'png', 'svg', 'gif'];
  readonly defaultDescriptionParser = BBCodeParser.parse;
  readonly usernameShortcuts = [
    {
      key: 'hf',
      url: 'https://www.hentai-foundry.com/user/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(this.BASE_URL, data._id);
    if (res.body?.includes('Logout')) {
      status.loggedIn = true;
      status.username = res.body.match(/class=.navlink. href=.\/user\/(.*?)\//)[1];
      Http.saveSessionCookies(this.BASE_URL, data._id);
    }

    // Debugging for a user
    if (!res.body) {
      this.logger.log(
        `HentaiFoundry returned empty body: ${res.response.statusCode}: ${res.response.statusMessage} - ${res.error}`,
      );
    }

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(50) };
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
  ): Promise<PostResponse> {
    const page = await Http.get<string>(`${this.BASE_URL}/UserBlogs/create`, data.part.accountId);
    this.verifyResponse(page, 'Load page');
    this.checkCancelled(cancellationToken);
    const post = await Http.post(`${this.BASE_URL}/UserBlogs/create`, data.part.accountId, {
      type: 'multipart',
      data: {
        YII_CSRF_TOKEN: HtmlParserUtil.getInputValue(page.body, 'YII_CSRF_TOKEN'),
        'UserBlogs[blog_title]': data.title,
        'UserBlogs[blog_body]': data.description,
      },
    });
    this.verifyResponse(post, 'Check post');
    return this.createPostResponse({ source: post.returnUrl });
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<HentaiFoundryFileOptions>,
  ): Promise<PostResponse> {
    const page = await Http.get<string>(`${this.BASE_URL}/pictures/create`, data.part.accountId);
    this.verifyResponse(page, 'Load form');
    const { options } = data;
    const form: any = {
      YII_CSRF_TOKEN: HtmlParserUtil.getInputValue(page.body, 'YII_CSRF_TOKEN'),
      'Pictures[user_id]': HtmlParserUtil.getInputValue(page.body, 'Pictures[user_id]'),
      'Pictures[title]': data.title,
      'Pictures[description]': data.description,
      'Pictures[fileupload]': data.primary.file,
      'Pictures[submissionPolicyAgree]': '1',
      yt0: 'Create',
      'Pictures[edit_tags]': this.formatTags(data.tags),
      'Pictures[is_scrap]': options.scraps ? '1' : '0',
      'Pictures[comments_type]': options.disableComments ? '-1' : '0',
      'Pictures[categoryHier]': options.category || '',
      'Pictures[rating_nudity]': options.nudityRating,
      'Pictures[rating_violence]': options.violenceRating,
      'Pictures[rating_profanity]': options.profanityRating,
      'Pictures[rating_racism]': options.racismRating,
      'Pictures[rating_sex]': options.sexRating,
      'Pictures[rating_spoilers]': options.spoilersRating,
      'Pictures[rating_yaoi]': options.yaoi ? '1' : '0',
      'Pictures[rating_yuri]': options.yuri ? '1' : '0',
      'Pictures[rating_teen]': options.teen ? '1' : '0',
      'Pictures[rating_guro]': options.guro ? '1' : '0',
      'Pictures[rating_furry]': options.furry ? '1' : '0',
      'Pictures[rating_beast]': options.beast ? '1' : '0',
      'Pictures[rating_male]': options.male ? '1' : '0',
      'Pictures[rating_female]': options.female ? '1' : '0',
      'Pictures[rating_futa]': options.futa ? '1' : '0',
      'Pictures[rating_other]': options.other ? '1' : '0',
      'Pictures[rating_scat]': options.scat ? '1' : '0',
      'Pictures[rating_incest]': options.incest ? '1' : '0',
      'Pictures[rating_rape]': options.rape ? '1' : '0',
      'Pictures[media_id]': options.media,
      'Pictures[time_taken]': options.timeTaken || '',
      'Pictures[reference]': options.reference || '',
      'Pictures[license_id]': '0',
    };

    this.checkCancelled(cancellationToken);
    const post = await Http.post<string>(`${this.BASE_URL}/pictures/create`, data.part.accountId, {
      type: 'multipart',
      data: form,
    });

    this.verifyResponse(post, 'Verify post');
    if (!post.body.includes('Pictures_title')) {
      return this.createPostResponse({ source: post.returnUrl });
    }

    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  formatTags(tags: string[]) {
    const maxLength = 500;
    const t = super.formatTags(tags);
    let tagString = t.join(', ').trim();

    return tagString.length > maxLength
      ? tagString
          .substring(0, maxLength)
          .split(', ')
          .filter(tag => tag.length >= 3)
          .join(', ')
      : tagString;
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<HentaiFoundryFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (!submissionPart.data.category) {
      problems.push('Must select a category.');
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    const { type, size, name } = submission.primary;
    let maxMB: number = 50;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Hentai Foundry limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
