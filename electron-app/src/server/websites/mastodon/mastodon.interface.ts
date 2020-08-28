import {
  DefaultFileOptions,
  DefaultOptions,
} from '../../submission/submission-part/interfaces/default-options.interface';

export interface MastodonFileOptions extends DefaultFileOptions {
  useTitle: boolean;
  spoilerText: string;
}

export interface MastodonNotificationOptions extends DefaultOptions {
  useTitle: boolean;
  spoilerText: string;
}
