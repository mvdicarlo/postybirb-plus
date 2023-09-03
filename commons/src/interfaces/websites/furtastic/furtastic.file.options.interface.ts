import { DefaultFileOptions } from '../../submission/default-options.interface';

// tslint:disable-next-line: class-name
export interface furtasticFileOptions extends DefaultFileOptions {
  folder?: string;
  contentWarning?: string;
}
