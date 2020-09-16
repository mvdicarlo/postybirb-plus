import { DefaultFileOptions } from '../submission/default-options.interface';

export interface e621Options extends DefaultFileOptions {
  sources: string[];
  parentId?: string;
}
