import { Injectable } from '@nestjs/common';
import { WebsiteService } from '../website.service';
import { LoginResponse } from '../interfaces/login-response.interface';
import { UserAccount } from '../../account/account.interface';

@Injectable()
export class Weasyl extends WebsiteService {
  readonly defaultStatusOptions: any = {};
  readonly defaultFileSubmissionOptions: any = {};
  readonly BASE_URL: string = 'https://www.weasyl.com';
  readonly acceptsFiles: string[] = ['png', 'jpg', 'jpeg'];

  parseDescription(text: string): string {
    throw new Error('Method not implemented.');
  }

  postStatusSubmission(data: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  postFileSubmission(data: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async checkLoginStatus(data: UserAccount): Promise<LoginResponse> {
    return { loggedIn: true, username: 'Test', data: {} };
  }

  validateFileSubmission(data: any): string[] {
    throw new Error('Method not implemented.');
  }

  validateStatusSubmission(data: any): string[] {
    throw new Error('Method not implemented.');
  }
}
