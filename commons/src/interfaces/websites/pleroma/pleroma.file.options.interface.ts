import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface PleromaFileOptions extends DefaultFileOptions {
  useTitle: boolean;
  spoilerText?: string;
  visibility: string;
  altText?: string;
  replyToUrl?: string;
}
