import { Website } from './interfaces/website.interface';
import { LoginResponse } from './interfaces/login-response.interface';
import { UserAccount } from 'src/account/account.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import {
  SubmissionPart,
  DefaultOptions,
} from 'src/submission/interfaces/submission-part.interface';
import * as _ from 'lodash';
import { SubmissionType } from 'src/submission/enums/submission-type.enum';

export abstract class WebsiteService implements Website {
  abstract readonly defaultStatusOptions?: any;
  abstract readonly defaultFileSubmissionOptions: any;
  abstract readonly BASE_URL: string;
  abstract readonly acceptsFiles: string[];

  readonly enableAdvertisement: boolean = true;
  readonly refreshInterval: number = 1800000;
  readonly refreshBeforePost: boolean = false;
  readonly waitBetweenPostsInterval: number = 4000;
  readonly acceptsAdditionalFiles: boolean = false;
  readonly acceptsSourceUrls: boolean = false;
  readonly accountInformation: Map<string, any> = new Map();

  abstract parseDescription(text: string): string;

  abstract postStatusSubmission(data: any): Promise<any>;

  abstract postFileSubmission(data: any): Promise<any>;

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

  abstract checkLoginStatus(data: UserAccount): Promise<LoginResponse>;

  abstract validateFileSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): string[];

  abstract validateStatusSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): string[];
}
