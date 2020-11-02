import { MastodonFileOptionsEntity } from './mastodon.file.options';
import { MastodonNotificationOptionsEntity } from './mastodon.notification.options';

export class Mastodon {
  static readonly FileOptions = MastodonFileOptionsEntity;
  static readonly NotificationOptions = MastodonNotificationOptionsEntity;
}
