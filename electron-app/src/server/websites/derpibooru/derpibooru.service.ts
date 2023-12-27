import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  DerpibooruFileOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PostResponse,
  SubmissionPart,
  SubmissionRating,
  UsernameShortcut,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { MarkdownParser } from 'src/server/description-parsing/markdown/markdown.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class Derpibooru extends Website {
  BASE_URL: string = 'https://derpibooru.org';
  MAX_CHARS: number = -1; // No limit
  acceptsFiles: string[] = ['jpeg', 'jpg', 'png', 'svg', 'gif', 'webm'];
  acceptsSourceUrls: boolean = true;
  enableAdvertisement: boolean = false;
  defaultDescriptionParser = MarkdownParser.parse;
  usernameShortcuts: UsernameShortcut[] = [
    {
      key: 'db',
      url: 'https://derpibooru.org/profiles/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(`${this.BASE_URL}`, data._id);
    if (res.body.includes('Logout')) {
      status.loggedIn = true;
      status.username = res.body.match(/data-user-name="(.*?)"/)[1];
      Http.saveSessionCookies(this.BASE_URL, data._id);
    }
    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(100) };
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DerpibooruFileOptions>,
  ): Promise<PostResponse> {
    try {
      return await this.attemptFilePost(cancellationToken, data);
    } catch (err) {
      // Users have reported it working on a second post :shrug:
      this.logger.warn(err, 'Derpibooru Post Retry');
      return await this.attemptFilePost(cancellationToken, data);
    }
  }

  private getRating(rating: SubmissionRating) {
    switch (rating) {
      case SubmissionRating.MATURE:
        return 'questionable';
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return 'explicit';
      case SubmissionRating.GENERAL:
      default:
        return 'safe';
    }
  }

  private async attemptFilePost(
    cancellationToken: CancellationToken,
    data: FilePostData<DerpibooruFileOptions>,
  ): Promise<PostResponse> {
    const tags: string[] = this.parseTags(data.tags, {
      spaceReplacer: ' ',
      minLength: 1,
      maxLength: 100,
    });
    const ratingTag: string = this.getRating(data.rating);
    const knownRatings: string[] = [
      'safe',
      'suggestive',
      'questionable',
      'explicit',
      'semi-grimdark',
      'grimdark',
      'grotesque',
    ];
    const lowerCaseTags = tags.map(t => t.toLowerCase());
    if (!lowerCaseTags.includes(ratingTag)) {
      let add = true;

      for (const r of knownRatings) {
        if (lowerCaseTags.includes(r)) {
          add = false;
          break;
        }
      }

      if (add) {
        tags.push(ratingTag);
      }
    }

    const form: any = {
      ...(await BrowserWindowUtil.getFormData(data.part.accountId, `${this.BASE_URL}/images/new`, {
        custom: 'document.body.querySelectorAll("form")[3]',
      })),
      _method: 'post',
      'image[tag_input]': this.formatTags(tags).join(', ').trim(),
      'image[image]': data.primary.file,
      'image[description]': data.description,
      'image[source_url]': data.options.source || data.sources[0] || '',
    };

    this.checkCancelled(cancellationToken);
    const postResponse = await Http.post<string>(`${this.BASE_URL}/images`, data.part.accountId, {
      type: 'multipart',
      data: form,
    });

    this.verifyResponse(postResponse);
    return this.createPostResponse({});
  }

  formatTags(tags: string[]) {
    return tags;
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 3) {
      problems.push('Requires at least 3 tags.');
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    const { type, size, name } = submission.primary;
    let maxMB: number = 100;

    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Derpibooru limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
