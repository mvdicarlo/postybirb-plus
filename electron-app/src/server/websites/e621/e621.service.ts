import { Injectable } from '@nestjs/common';
import { app } from 'electron';
import {
  DefaultOptions,
  e621AccountData,
  e621FileOptions,
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
export class e621 extends Website {
  readonly BASE_URL: string = 'https://e621.net';
  readonly acceptsFiles: string[] = ['jpeg', 'jpg', 'png', 'gif', 'webm'];
  readonly acceptsSourceUrls: boolean = true;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly enableAdvertisement: boolean = false;

  readonly usernameShortcuts = [
    {
      key: 'e6',
      url: 'https://e621.net/user/show/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: e621AccountData = data.data;
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
    return UsernameParser.replaceText(text, 'e6', '@$1').replace(
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
    data: FilePostData<e621FileOptions>,
    accountData: e621AccountData,
  ): Promise<PostResponse> {
    const form: any = {
      login: accountData.username,
      api_key: accountData.key,
      'upload[tag_string]': this.formatTags(data.tags),
      'upload[file]': data.primary.file,
      'upload[rating]': this.getRating(data.rating),
      'upload[description]': data.description,
      'upload[parent_id]': data.options.parentId || '',
      'upload[source]': [...data.options.sources, ...data.sources]
        .filter((s) => s)
        .slice(0, 5)
        .join('%0A'),
    };

    this.checkCancelled(cancellationToken);
    const post = await Http.post<{
      success: boolean;
      location: string;
      reason: string;
      message: string;
    }>(`${this.BASE_URL}/uploads.json`, undefined, {
      type: 'multipart',
      data: form,
      skipCookies: true,
      requestOptions: { json: true },
      headers: {
        'User-Agent': `PostyFox/${app.getVersion()}`,
      },
    });

    if (post.body.success && post.body.location) {
      return this.createPostResponse({ source: `https://e621.net${post.body.location}` });
    }

    return Promise.reject(
      this.createPostResponse({
        additionalInfo: JSON.stringify(post.body),
        message: `${post.body.reason || ''} || ${post.body.message || ''}`,
      }),
    );
  }

  private getRating(rating: SubmissionRating) {
    switch (rating) {
      case SubmissionRating.MATURE:
        return 'q';
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return 'e';
      case SubmissionRating.GENERAL:
      default:
        return 's';
    }
  }

  formatTags(tags: string[]) {
    return super.formatTags(tags).join(' ').trim();
  }

  transformAccountData(data: e621AccountData) {
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

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 4) {
      problems.push('Requires at least 4 tags.');
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
        problems.push(`e621 limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
