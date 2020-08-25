import { Injectable, Logger } from '@nestjs/common';
import { session } from 'electron';
import CookieConverter from 'src/server/utils/cookie-converter.util';

@Injectable()
export class RemoteService {
  private readonly logger = new Logger(RemoteService.name);

  async updateCookies(accountId: string, cookies: Electron.Cookie[]): Promise<void> {
    this.logger.log(accountId, 'Updating Cookies');
    const accountSession = session.fromPartition(`persist:${accountId}`);
    await accountSession.clearStorageData();
    await Promise.all(
      cookies.map(cookie => {
        return accountSession.cookies.set(CookieConverter.convertCookie(cookie));
      }),
    );
  }
}
