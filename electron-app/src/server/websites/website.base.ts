import { NotImplementedException } from '@nestjs/common';
import * as _ from 'lodash';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { HTMLFormatParser } from 'src/server/description-parsing/html/html.parser';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import { HttpResponse } from 'src/server/http/http.util';
import { SubmissionType } from 'src/server/submission/enums/submission-type.enum';
import { FileRecord } from 'src/server/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/server/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from 'src/server/submission/interfaces/submission.interface';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { PostResponse } from 'src/server/submission/post/interfaces/post-response.interface';
import {
  DefaultFileOptions,
  DefaultOptions,
} from 'src/server/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/server/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import { FallbackInformation } from './interfaces/fallback-information.interface';
import { LoginResponse } from './interfaces/login-response.interface';
import { ScalingOptions } from './interfaces/scaling-options.interface';
import { UsernameShortcut } from './interfaces/username-shortcut.interface';

interface TagParseOptions {
  spaceReplacer: string;
  minLength?: number;
  maxLength?: number;
}

export abstract class Website {
  abstract readonly BASE_URL: string;
  abstract readonly acceptsFiles: string[];
  abstract readonly fileSubmissionOptions: object;
  readonly notificationSubmissionOptions: object;

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

  protected checkCancelled(ct: CancellationToken) {
    if (ct.isCancelled()) {
      throw new Error('Submission was cancelled while posting.');
    }
  }

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
        return _.cloneDeep(this.fileSubmissionOptions);
      case SubmissionType.NOTIFICATION:
        return _.cloneDeep(this.notificationSubmissionOptions || this.fileSubmissionOptions); // TODO make it so fallback isn't what I do here. Should force notification options to be specified
    }
  }

  abstract getScalingOptions(file: FileRecord): ScalingOptions | undefined;

  abstract async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DefaultFileOptions>,
    accountData: any,
  ): Promise<PostResponse>;

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, any>,
    accountData: any,
  ): Promise<PostResponse> {
    throw new NotImplementedException('Method not implemented');
  }

  fallbackFileParser(html: string): FallbackInformation {
    return { text: PlaintextParser.parse(html), type: 'text/plain', extension: 'txt' };
  }

  parseTags(
    tags: string[],
    options: TagParseOptions = { spaceReplacer: '_', minLength: 1, maxLength: 100 },
  ): string[] {
    return tags
      .map(tag => tag.trim())
      .filter(tag => tag)
      .filter(tag => {
        return tag.length >= (options.minLength || 1) && tag.length <= (options.maxLength || 100);
      })
      .map(tag => tag.replace(/\s/g, options.spaceReplacer).trim());
  }

  protected formatTags(tags: string[], options?: TagParseOptions): any {
    return this.parseTags(tags, options);
  }

  parseDescription(text: string, type?: SubmissionType): string {
    return this.defaultDescriptionParser(text);
  }

  postParseDescription(text: string, type?: SubmissionType): string {
    return text;
  }

  preparseDescription(text: string, type?: SubmissionType): string {
    return text || '';
  }

  protected storeAccountInformation(profileId: string, key: string, value: any): void {
    this.accountInformation.set(profileId, {
      ...this.accountInformation.get(profileId),
      [key]: value,
    });
  }

  transformAccountData(data: object): object {
    return {};
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
        additionalInfo: `${info ? `${info}\n\n` : ''}${
          response.body
            ? typeof response.body === 'object'
              ? JSON.stringify(response.body, null, 1)
              : response.body
            : ''
        }`,
      });
    }
  }
}
