import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface KoFiFileOptions extends DefaultFileOptions {
  album?: string;
  hiRes: boolean;
  audience: 'public' | 'supporter' | 'recurringSupporter';
}
