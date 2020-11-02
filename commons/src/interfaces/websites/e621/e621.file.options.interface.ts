import { DefaultFileOptions } from '../../submission/default-options.interface';

// tslint:disable-next-line: class-name
export interface e621FileOptions extends DefaultFileOptions {
  sources: string[];
  parentId?: string;
}
