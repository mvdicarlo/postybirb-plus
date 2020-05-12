export class OAuthUtil {
  static getURL(path: string): string {
    return `${global.AUTH_SERVER_URL}/${path}`;
  }
}
