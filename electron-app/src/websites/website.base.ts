import { LoginResponse } from './interfaces/login-response.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import * as _ from 'lodash';
import { SubmissionType } from 'src/submission/enums/submission-type.enum';
import {
  DefaultOptions,
  DefaultFileOptions,
} from 'src/submission/submission-part/interfaces/default-options.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import { UsernameShortcut } from './interfaces/username-shortcut.interface';
import { HTMLFormatParser } from 'src/description-parsing/html/html.parser';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { ScalingOptions } from './interfaces/scaling-options.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { HttpResponse } from 'src/http/http.util';
import { PlaintextParser } from 'src/description-parsing/plaintext/plaintext.parser';
import { FallbackInformation } from './interfaces/fallback-information.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';

export abstract class Website {
  abstract readonly BASE_URL: string;
  abstract readonly acceptsFiles: string[];
  abstract readonly defaultFileSubmissionOptions: object;
  readonly defaultStatusOptions: any = {};

  readonly acceptsAdditionalFiles: boolean = false;
  readonly acceptsSourceUrls: boolean = false;
  readonly accountInformation: Map<string, any> = new Map();
  readonly enableAdvertisement: boolean = true;
  readonly refreshBeforePost: boolean = false;
  readonly refreshInterval: number = 1800000;
  readonly usernameShortcuts: UsernameShortcut[] = [];
  readonly waitBetweenPostsInterval: number = 4000;

  readonly defaultDescriptionParser = HTMLFormatParser.parse;

  abstract async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse>;

  protected createPostResponse(postResponse: Partial<PostResponse>): PostResponse {
    return {
      message: postResponse.error ? 'Unknown Error' : '',
      ...postResponse,
      time: new Date().toLocaleString(),
      website: this.constructor.name,
    };
  }

  getAccountInfo(id: string, key?: string) {
    return key
      ? _.get(this.accountInformation.get(id), key)
      : this.accountInformation.get(id) || {};
  }

  getDefaultOptions(submissionType: SubmissionType) {
    switch (submissionType) {
      case SubmissionType.FILE:
        return _.cloneDeep(this.defaultFileSubmissionOptions);
      case SubmissionType.NOTIFICATION:
        return _.cloneDeep(this.defaultStatusOptions);
    }
  }

  abstract getScalingOptions(file: FileRecord): ScalingOptions;

  abstract async postFileSubmission(
    data: FilePostData<DefaultFileOptions>,
    accountData: any,
  ): Promise<PostResponse>;

  abstract async postNotificationSubmission(
    data: PostData<Submission, any>,
    accountData: any,
  ): Promise<PostResponse>;

  fallbackFileParser(html: string): FallbackInformation {
    return { text: PlaintextParser.parse(html), type: 'text/plain', extension: 'txt' };
  }

  parseTags(
    tags: string[],
    options = { spaceReplacer: '_', minLength: 1, maxLength: 100 },
  ): string[] {
    return tags
      .filter(tag => {
        const t: string = tag.trim();
        return t.length >= (options.minLength || 1) && t.length <= (options.maxLength || 100);
      })
      .map(tag => tag.replace(/\s/g, options.spaceReplacer));
  }

  parseDescription(text: string): string {
    return this.defaultDescriptionParser(text);
  }

  postParseDescription(text: string): string {
    return text;
  }

  preparseDescription(text: string): string {
    return text || '';
  }

  protected storeAccountInformation(profileId: string, key: string, value: any): void {
    this.accountInformation.set(profileId, {
      ...this.accountInformation.get(profileId),
      [key]: value,
    });
  }

  abstract validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts;

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    return { problems: [], warnings: [] };
  }

  protected verifyResponse(response: HttpResponse<any>, info?: string): void {
    if (response.error || response.response.statusCode > 303) {
      throw this.createPostResponse({
        error: response.error || response.response.statusCode,
        additionalInfo: `${info ? `${info}\n\n` : ''}${response.body}`,
      });
    }
  }
}
