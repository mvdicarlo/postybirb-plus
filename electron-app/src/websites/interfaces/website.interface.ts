import { UserAccount } from '../../account/account.interface';
import { LoginResponse } from './login-response.interface';

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

  parseDescription(text: string): string;
  postStatusSubmission(data: any): Promise<any>;
  postFileSubmission(data: any): Promise<any>;
  parseTags(
    tags: string[],
    options?: { minLength?: number; maxLength?: number; spaceReplace?: string },
  ): any;
  checkLoginStatus(data: UserAccount): Promise<LoginResponse>;
  validateFileSubmission(data: any): string[];
  validateStatusSubmission(data: any): string[];
}
