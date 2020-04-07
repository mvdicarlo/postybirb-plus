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

export abstract class Website {
  abstract readonly BASE_URL: string;
  abstract readonly acceptsFiles: string[];
  abstract readonly defaultFileSubmissionOptions: any;
  abstract readonly defaultStatusOptions?: any;

  readonly acceptsAdditionalFiles: boolean = false;
  readonly acceptsSourceUrls: boolean = false;
  readonly accountInformation: Map<string, any> = new Map();
  readonly enableAdvertisement: boolean = true;
  readonly refreshBeforePost: boolean = false;
  readonly refreshInterval: number = 1800000;
  readonly usernameShortcuts: UsernameShortcut[] = [];
  readonly waitBetweenPostsInterval: number = 4000;

  readonly defaultDescriptionParser = HTMLFormatParser.parse;

  abstract checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse>;

  protected createPostResponse(postResponse: Partial<PostResponse>): PostResponse {
    return {
      message: postResponse.error ? 'Unknown Error' : '',
      ...postResponse,
      time: new Date().toLocaleString(),
      website: this.constructor.name,
    };
  }

  getAccountInfo(id: string) {
    return this.accountInformation.get(id) || {};
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

  abstract async postNotificationSubmission(
    data: PostData<Submission, any>,
    accountData: any,
  ): Promise<PostResponse>;

  abstract async postFileSubmission(
    data: FilePostData<DefaultFileOptions>,
    accountData: any,
  ): Promise<PostResponse>;

  protected verifyResponse(response: HttpResponse<any>): void {
    if (response.error || response.response.statusCode > 303) {
      throw this.createPostResponse({
        error: response.error || response.response.statusCode,
        additionalInfo: response.body,
      });
    }
  }

  preparseDescription(text: string): string {
    if (!text) {
      return '';
    }
    return text;
  }

  parseDescription(text: string): string {
    return this.defaultDescriptionParser(text);
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

  protected storeAccountInformation(profileId: string, key: string, value: any): void {
    this.accountInformation.set(profileId, {
      ...this.accountInformation.get(profileId),
      [key]: value,
    });
  }

  abstract validateFileSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts;

  abstract validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts;
}
