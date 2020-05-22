export interface Authorizer {
  start(callback: (data: any) => void): void;
  stop(): void;
  getAuthURL(): string;
}
