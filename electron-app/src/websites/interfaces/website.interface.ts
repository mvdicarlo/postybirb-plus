import { UserAccount } from 'src/account/account.interface';
import { LoginResponse } from './login-response.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { SubmissionPart } from 'src/submission/interfaces/submission-part.interface';
import { SubmissionType } from 'src/submission/enums/submission-type.enum';
import { UsernameShortcut } from './username-shortcut.interface';
import {
  DefaultFileOptions,
  DefaultOptions,
} from 'src/submission/interfaces/default-options.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';

export interface Website {
  readonly BASE_URL: string;
  readonly acceptsAdditionalFiles: boolean;
  readonly acceptsFiles: string[];
  readonly acceptsSourceUrls: boolean;
  readonly accountInformation: Map<string, any>;
  readonly defaultFileSubmissionOptions: any;
  readonly defaultStatusOptions?: any;
  readonly enableAdvertisement: boolean;
  readonly refreshBeforePost: boolean;
  readonly refreshInterval: number;
  readonly usernameShortcuts: UsernameShortcut[];
  readonly waitBetweenPostsInterval: number;

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
  ): ValidationParts;
  validateStatusSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts;
}
