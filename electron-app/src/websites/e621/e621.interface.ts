import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface e621Options extends DefaultFileOptions {
  sources: string[];
  parentId?: string;
}
