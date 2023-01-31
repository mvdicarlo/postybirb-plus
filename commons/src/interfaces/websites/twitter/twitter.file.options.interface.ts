import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface TwitterFileOptions extends DefaultFileOptions {
  contentBlur?: 'other' | 'graphic_violence' | 'adult_content';
}
