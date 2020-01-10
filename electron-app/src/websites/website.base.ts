import { LoginResponse } from './interfaces/login-response.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { SubmissionPart } from 'src/submission/interfaces/submission-part.interface';
import * as _ from 'lodash';
import { SubmissionType } from 'src/submission/enums/submission-type.enum';
import { DefaultOptions } from 'src/submission/interfaces/default-options.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import { UsernameShortcut } from './interfaces/username-shortcut.interface';
import { HTMLFormatParser } from 'src/description-parsing/html/html.parser';
import UserAccountEntity from 'src/account/models/user-account.entity';

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

  abstract postStatusSubmission(data: any): Promise<any>;

  abstract postFileSubmission(data: any): Promise<any>;

  preparseDescription(text: string): string {
    if (!text) {
      return '';
    }
    return text;
  }

  parseDescription(text: string): string {
    return this.defaultDescriptionParser(text);
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

  protected storeAccountInformation(profileId: string, key: string, value: any): void {
    this.accountInformation.set(profileId, {
      ...this.accountInformation.get(profileId),
      [key]: value,
    });
  }

  parseTags(
    tags: string[],
    options = { spaceReplacer: '_', minLength: 1, maxLength: 100 },
  ): string[] {
    return tags
      .filter(tag => {
        const t: string = tag.trim();
        return t.length >= (options.minLength || 0) && t.length <= (options.maxLength || 100);
      })
      .map(tag => tag.replace(/\s/g, options.spaceReplacer));
  }

  abstract checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse>;

  abstract validateFileSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts;

  abstract validateStatusSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts;
}
