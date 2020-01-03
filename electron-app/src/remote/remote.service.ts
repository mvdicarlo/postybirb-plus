import { Injectable, Logger } from '@nestjs/common';
import { session } from 'electron';

@Injectable()
export class RemoteService {
  private readonly logger = new Logger(RemoteService.name);

  async updateCookies(accountId: string, cookies: Electron.Cookie[]): Promise<void> {
    this.logger.log(accountId, 'Updating Cookies');
    const accountSession = session.fromPartition(`persist:${accountId}`);
    await accountSession.clearStorageData();
    await Promise.all(
      cookies.map(cookie => {
        return accountSession.cookies.set(this.convertCookie(cookie));
      }),
    );
  }

  convertCookie(cookie: Electron.Cookie): Electron.CookiesSetDetails {
    const url = `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path || ''}`;
    const details: Electron.CookiesSetDetails = {
      domain: cookie.domain,
      httpOnly: cookie.httpOnly || false,
      name: cookie.name,
      secure: cookie.secure || false,
      url: url.replace('://.', '://'),
      value: cookie.value,
    };

    if (cookie.expirationDate) {
      details.expirationDate = cookie.expirationDate;
    }

    return details;
  }
}
