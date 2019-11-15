import { Injectable, Logger } from '@nestjs/common';
import { WebsiteService } from '../website.service';
import { LoginResponse } from '../interfaces/login-response.interface';
import { UserAccount } from '../../account/account.interface';
import Http from '../../http/http.util';
import * as _ from 'lodash';

@Injectable()
export class Weasyl extends WebsiteService {
  private readonly logger = new Logger(Weasyl.name);

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
    const res = await Http.get<any>(`${this.BASE_URL}/api/whoami`, data.id, {
      requestOptions: { json: true },
    });
    const status: LoginResponse = { loggedIn: false, username: null };
    try {
      const login: string = _.get(res.body, 'login');
      status.loggedIn = !!login;
      status.username = login;
    } catch (e) {
      /* Swallow */
    }
    return status;
  }

  validateFileSubmission(data: any): string[] {
    throw new Error('Method not implemented.');
  }

  validateStatusSubmission(data: any): string[] {
    throw new Error('Method not implemented.');
  }
}
