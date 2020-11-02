import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface MastodonFileOptions extends DefaultFileOptions {
  useTitle: boolean;
  spoilerText?: string;
}
