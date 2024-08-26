import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface CohostFileOptions extends DefaultFileOptions {
  spoilerText?: string;
  spoilerTextOverwrite?: boolean;
}
