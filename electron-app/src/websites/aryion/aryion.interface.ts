import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface AryionFileOptions extends DefaultFileOptions {
  folder: string[];
  viewPermissions: string;
  commentPermissions: string;
  tagPermissions: string;
  requiredTag?: string;
  scraps: boolean;
}
