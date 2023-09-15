import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface FurtasticFileOptions extends DefaultFileOptions {
  folder?: string;
  contentWarning?: string;
}
