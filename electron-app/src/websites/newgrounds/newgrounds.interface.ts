import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface NewgroundsFileOptions extends DefaultFileOptions {
  creativeCommons: boolean;
  commercial: boolean;
  modification: boolean;
  sketch: boolean;
  category: string;
  nudity: 'a' | 'b' | 'c' | undefined;
  violence: 'a' | 'b' | 'c' | undefined;
  explicitText: 'a' | 'b' | 'c' | undefined;
  adultThemes: 'a' | 'b' | 'c' | undefined;
}
