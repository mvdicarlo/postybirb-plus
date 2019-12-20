import { UserAccount } from 'src/account/account.interface';
import { LoginResponse } from './login-response.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { SubmissionPart } from 'src/submission/interfaces/submission-part.interface';
import { SubmissionType } from 'src/submission/enums/submission-type.enum';
import {
  DefaultFileOptions,
  DefaultOptions,
} from 'src/submission/interfaces/default-options.interface';

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
  validateFileSubmission<T>(
    submission: Submission,
    submissionPart: SubmissionPart<DefaultFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): string[];
  validateStatusSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): string[];
}
