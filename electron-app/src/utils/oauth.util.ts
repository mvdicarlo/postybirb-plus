export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error: string;
}

export class OAuthUtil {
  static getURL(path: string): string {
    return `${global.AUTH_SERVER_URL}/${path}`;
  }
}
