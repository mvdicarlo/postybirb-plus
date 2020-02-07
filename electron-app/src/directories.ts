import * as path from 'path';
import * as fs from 'fs-extra';

export const BASE_DIRECTORY = global.BASE_DIRECTORY;
export const SUBMISSION_FILE_DIRECTORY = path.join(
  BASE_DIRECTORY,
  'submission files',
);
export const THUMBNAIL_FILE_DIRECTORY = path.join(
  BASE_DIRECTORY,
  'thumbnail files',
);
export const DATABASE_DIRECTORY = path.join(BASE_DIRECTORY, 'data');

fs.ensureDirSync(DATABASE_DIRECTORY);
fs.ensureDirSync(SUBMISSION_FILE_DIRECTORY);
fs.ensureDirSync(THUMBNAIL_FILE_DIRECTORY);
