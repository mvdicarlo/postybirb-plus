import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface PixivFileOptions extends DefaultFileOptions {
  communityTags: boolean;
  matureContent: string[];
  original: boolean;
  sexual?: boolean;
  containsContent: string[];
  aiGenerated: boolean;
}
