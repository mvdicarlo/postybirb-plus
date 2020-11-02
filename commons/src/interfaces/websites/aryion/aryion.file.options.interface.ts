import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface AryionFileOptions extends DefaultFileOptions {
  folder: string[];
  viewPermissions: string;
  commentPermissions: string;
  tagPermissions: string;
  requiredTag?: string;
  scraps: boolean;
}
