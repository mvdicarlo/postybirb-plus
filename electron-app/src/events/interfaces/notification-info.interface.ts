export interface NotificationInfo {
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  title?: string;
  body: string;
  sticky: boolean;
}
