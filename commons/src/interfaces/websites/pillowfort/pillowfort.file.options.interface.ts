import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface PillowfortFileOptions extends DefaultFileOptions {
  privacy: string;
  allowComments: boolean;
  allowReblogging: boolean;
}
