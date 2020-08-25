export default class CookieConverter {
  static convertCookie(cookie: Electron.Cookie): Electron.CookiesSetDetails {
    const url = `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path || ''}`;
    const details: Electron.CookiesSetDetails = {
      domain: `.${cookie.domain}`.replace('..', '.'),
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
