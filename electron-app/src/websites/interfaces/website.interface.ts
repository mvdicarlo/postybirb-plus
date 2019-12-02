import { UserAccount } from 'src/account/account.interface';
import { LoginResponse } from './login-response.interface';
import { SubmissionType, Submission } from 'src/submission/interfaces/submission.interface';
import {
  SubmissionPart,
  DefaultOptions,
} from 'src/submission/interfaces/submission-part.interface';

export interface Website {
  readonly BASE_URL: string;
  readonly enableAdvertisement: boolean;
  readonly refreshInterval: number;
  readonly refreshBeforePost: boolean;
  readonly waitBetweenPostsInterval: number;
  readonly acceptsAdditionalFiles: boolean;
  readonly acceptsSourceUrls: boolean;
  readonly acceptsFiles: string[];
  readonly defaultStatusOptions?: any;
  readonly defaultFileSubmissionOptions: any;
  readonly accountInformation: Map<string, any>;

  getAccountInfo(id: string): any;
  getDefaultOptions(submissionType: SubmissionType): any;
  parseDescription(text: string): string;
  postStatusSubmission(data: any): Promise<any>;
  postFileSubmission(data: any): Promise<any>;
  parseTags(
    tags: string[],
    options?: { minLength?: number; maxLength?: number; spaceReplace?: string },
  ): any;
  checkLoginStatus(data: UserAccount): Promise<LoginResponse>;
  validateFileSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): string[];
  validateStatusSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): string[];
}
