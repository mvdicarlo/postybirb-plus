import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface PatreonFileOptions extends DefaultFileOptions {
  tiers: string[];
  charge: boolean;
}
