import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface PixivFileOptions extends DefaultFileOptions {
  communityTags: boolean;
  matureContent: string[];
  original: boolean;
  sexual?: boolean;
  containsContent: string[];
}
