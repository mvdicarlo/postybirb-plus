import * as path from 'path';
import { AppGlobal } from 'src/app-global.interface';

export const BASE_DIRECTORY = (global as AppGlobal).BASE_DIRECTORY;
export const SUBMISSION_FILE_DIRECTORY = path.join(
  BASE_DIRECTORY,
  'submission files',
);
export const THUMBNAIL_FILE_DIRECTORY = path.join(
  BASE_DIRECTORY,
  'thumbnail files',
);
export const DATABASE_DIRECTORY = path.join(BASE_DIRECTORY, 'data');
