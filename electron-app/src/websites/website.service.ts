import { Website } from './interfaces/website.interface';
import { LoginResponse } from './interfaces/login-response.interface';
import { UserAccount } from '../account/account.interface';

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

  parseTags(
    tags: string[],
    options = { spaceReplacer: '_', minLength: 1, maxLength: 100 },
  ): string[] {
    return tags
      .filter(tag => {
        const t: string = tag.trim();
        return (
          t.length >= (options.minLength || 0) &&
          t.length <= (options.maxLength || 100)
        );
      })
      .map(tag => tag.replace(/\s/g, options.spaceReplacer));
  }

  abstract checkLoginStatus(data: UserAccount): Promise<LoginResponse>;

  abstract validateFileSubmission(data: any): string[];

  abstract validateStatusSubmission(data: any): string[];
}
