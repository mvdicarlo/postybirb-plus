import { Logger, NotImplementedException, UnprocessableEntityException } from '@nestjs/common';
import _ from 'lodash';
import {
  DefaultFileOptions,
  DefaultFileOptionsEntity,
  DefaultOptions,
  DefaultOptionsEntity,
  FileRecord,
  FileSubmission,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionType,
  UsernameShortcut,
  WebsiteOptions,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { HTMLFormatParser } from 'src/server/description-parsing/html/html.parser';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import { HttpResponse } from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import { FallbackInformation } from './interfaces/fallback-information.interface';
import { LoginResponse } from './interfaces/login-response.interface';
import { ScalingOptions } from './interfaces/scaling-options.interface';
import SubmissionPartEntity from '../submission/submission-part/models/submission-part.entity';
import { HttpResponse as ExperimentalHttpResponse } from 'src/server/utils/http-experimental';

interface TagParseOptions {
  spaceReplacer: string;
  minLength?: number;
  maxLength?: number;
}

export abstract class Website {
  protected readonly logger = new Logger(this.constructor.name);

  abstract readonly BASE_URL: string;
  abstract readonly acceptsFiles: string[];
  abstract MAX_CHARS: number;

  readonly skipHtmlStandardization: boolean = false;
  readonly acceptsAdditionalFiles: boolean = false;
  readonly acceptsSourceUrls: boolean = false;
  readonly accountInformation: Map<string, any> = new Map();
  readonly enableAdvertisement: boolean = true;
  readonly refreshBeforePost: boolean = false;
  readonly refreshInterval: number = 60_000 * 10;
  readonly usernameShortcuts: UsernameShortcut[] = [];
  readonly waitBetweenPostsInterval: number = 4000;

  readonly defaultDescriptionParser = HTMLFormatParser.parse;

  abstract checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse>;

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
    const options: {
      FileOptions: typeof DefaultFileOptionsEntity;
      NotificationOptions: typeof DefaultOptionsEntity;
    } = WebsiteOptions[this.constructor.name];
    switch (submissionType) {
      case SubmissionType.FILE:
        const FileObject: typeof DefaultFileOptionsEntity = options
          ? options.FileOptions || DefaultFileOptionsEntity
          : DefaultFileOptionsEntity;
        return FileObject;
      case SubmissionType.NOTIFICATION:
        const NotificationObject: typeof DefaultOptionsEntity = options
          ? options.NotificationOptions || DefaultOptionsEntity
          : DefaultOptionsEntity;
        return NotificationObject;
      default:
        throw new UnprocessableEntityException(`Unsupported submission type: ${submissionType}`);
    }
  }

  abstract getScalingOptions(file: FileRecord, accountId?: string): ScalingOptions | undefined;

  abstract postFileSubmission(
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

  formatTags(tags: string[], options?: TagParseOptions): string[] {
    return this.parseTags(tags, options);
  }

  validateInsertTags(
    warnings: string[],
    tags: string[],
    description: string,
    limit: number,
    getLength: (text: string) => number = text => text.length,
  ): void {
    const { includedTags, skippedTags } = this.calculateFittingTags(
      tags,
      description,
      limit,
      getLength,
    );
    const skippedCount = skippedTags.length;
    if (skippedCount !== 0) {
      const includedCount = includedTags.length;
      if (includedCount === 0) {
        warnings.push(`Can't fit any tags. Reduce description length to be able to include them.`);
      } else {
        const totalCount = includedCount + skippedCount;
        warnings.push(
          `Can only fit ${includedCount} out of ${totalCount} tags. ` +
            `Reduce description length to be able to include more. ` +
            `Skipped tags: ${skippedTags.join(', ')}. ` +
            `Included tags: ${includedTags.join(', ')}`,
        );
      }
    }
  }

  generateTagsString(
    tags: string[],
    description: string,
    websitePart: SubmissionPartEntity<DefaultOptions>,
  ): string {
    const { includedTags } = this.calculateFittingTags(tags, description, this.MAX_CHARS);
    const formattedTags = this.formatTags(includedTags);
    if (Array.isArray(formattedTags)) {
      return formattedTags.join(' ');
    }

    if (typeof formattedTags === 'string') {
      return formattedTags;
    }

    return '';
  }

  protected calculateFittingTags(
    tags: string[],
    description: string,
    limit: number,
    getLength: (text: string) => number = text => text.length,
  ): { includedTags: string[]; skippedTags: string[] } {
    const includedTags = [];
    const skippedTags = [];
    const appendToDescription = function (tag?: string): string {
      const suffix = tag ? [...includedTags, tag] : includedTags;
      if (suffix.length === 0) {
        return description;
      } else {
        return description + '\n\n' + suffix.join(' ');
      }
    };

    for (const tag of tags) {
      if (getLength(appendToDescription(tag)) <= limit) {
        includedTags.push(tag);
      } else {
        skippedTags.push(tag);
      }
      // Keep looping over all tags even if one of them doesn't fit, we might
      // find one that's short enough to cram in still.
    }

    return { includedTags, skippedTags };
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
  ): ValidationParts | Promise<ValidationParts>;

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts | Promise<ValidationParts> {
    return { problems: [], warnings: [] };
  }

  protected verifyResponseExperimental(
    response: ExperimentalHttpResponse<any>,
    info?: string,
  ): void {
    if (response.statusCode > 303) {
      throw this.createPostResponse({
        error: response.body || response.statusCode,
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
