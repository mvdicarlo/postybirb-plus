import { NotificationType } from './postybirb-notification.interface';

export interface UINotification {
  type: NotificationType;
  duration: number;
  message: string;
  title?: string;
}
