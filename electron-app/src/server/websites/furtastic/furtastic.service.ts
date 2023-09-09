import { Injectable } from '@nestjs/common';
import { app } from 'electron';
import {
  DefaultOptions,
  FurtasticAccountData,
  FurtasticFileOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PostResponse,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { UsernameParser } from 'src/server/description-parsing/miscellaneous/username.parser';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class Furtastic extends Website {
  readonly BASE_URL: string = 'https://api.furtastic.art';
  readonly acceptsFiles: string[] = ['jpeg', 'jpg', 'png', 'gif', 'webm'];
  readonly acceptsSourceUrls: boolean = true;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly enableAdvertisement: boolean = true;

  readonly usernameShortcuts = [
    {
      key: 'ft',
      url: 'https://furtastic.art/profile/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: FurtasticAccountData = data.data;
    if (accountData?.username) {
      status.username = accountData.username;
      status.loggedIn = true;
    }
    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(100) };
  }

  preparseDescription(text: string) {
    return UsernameParser.replaceText(text, 'ft', '@$1').replace(
      /<a(.*?)href="(.*?)"(.*?)>(.*?)<\/a>/gi,
      '"$4":$2',
    );
  }

  parseDescription(text: string) {
    text = text.replace(/<b>/gi, '[b]');
    text = text.replace(/<i>/gi, '[i]');
    text = text.replace(/<u>/gi, '[u]');
    text = text.replace(/<s>/gi, '[s]');
    text = text.replace(/<\/b>/gi, '[/b]');
    text = text.replace(/<\/i>/gi, '[/i]');
    text = text.replace(/<\/u>/gi, '[/u]');
    text = text.replace(/<\/s>/gi, '[/s]');
    text = text.replace(/<em>/gi, '[i]');
    text = text.replace(/<\/em>/gi, '[/i]');
    text = text.replace(/<strong>/gi, '[b]');
    text = text.replace(/<\/strong>/gi, '[/b]');
    text = text.replace(
      /<span style="color:\s*(.*?);*">((.|\n)*?)<\/span>/gim,
      '[color=$1]$2[/color]',
    );
    text = text.replace(/<a(.*?)href="(.*?)"(.*?)>(.*?)<\/a>/gi, '"$4":$2');
    return super.parseDescription(text);
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<FurtasticFileOptions>,
    accountData: FurtasticAccountData,
  ): Promise<PostResponse> {
    const form: any = {
      tags: this.formatTags(data.tags),
      'file[0]': data.primary.file,
      rating: this.getRating(data.rating),
      description: data.description,
      title: data.title
    };

    data.additional.forEach((file, index) => {
      form[`file[${index + 1}]`] = file.file;
    });

    this.checkCancelled(cancellationToken);
    const post = await Http.post<{
      success: boolean;
      location: string;
      reason: string;
      message: string;
    }>(`${this.BASE_URL}/private/api-upload`, undefined, {
      type: 'multipart',
      data: form,
      skipCookies: true,
      requestOptions: { json: true },
      headers: {
        'User-Agent': `PostyBirb/${app.getVersion()}`,
        'x-api-user': accountData.username,
        'x-api-key': accountData.key,
      },
    }) as any;

    if (post.body.status && post.body.status === true) {
      return this.createPostResponse({ source: `https://furtastic.art${post.body.url}` });
    }

    return Promise.reject(
      this.createPostResponse({
        additionalInfo: JSON.stringify(post.body),
        message: ` ${post.body.message}`,
      }),
    );
  }

  private getRating(rating: SubmissionRating) {
    switch (rating) {
      case SubmissionRating.MATURE:
        return 'nsfw';
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return 'nsfw';
      case SubmissionRating.GENERAL:
      default:
        return 'safe';
    }
  }

  formatTags(tags: string[]) {
    return super.formatTags(tags).join(' ').trim();
  }

  transformAccountData(data: FurtasticAccountData) {
    return {
      username: data?.username,
    };
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 1) {
      problems.push('Requires at least 1 tag.');
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    const { type, size, name } = submission.primary;
    let maxMB: number = 250;

    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Furtastic limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
