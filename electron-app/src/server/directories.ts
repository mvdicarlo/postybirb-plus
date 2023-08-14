import path from 'path';
import fs from 'fs-extra';

export const BASE_DIRECTORY = process.env.TEST
  ? path.join(__dirname, 'test-dir')
  : global.BASE_DIRECTORY;
export const SUBMISSION_FILE_DIRECTORY = path.join(BASE_DIRECTORY, 'submission', 'files');
export const THUMBNAIL_FILE_DIRECTORY = path.join(BASE_DIRECTORY, 'submission', 'thumbnails');
export const TEMP_FILE_DIRECTORY = path.join(BASE_DIRECTORY, 'temp');
export const DATABASE_DIRECTORY = path.join(BASE_DIRECTORY, 'data');

export function ensure() {
  fs.ensureDirSync(DATABASE_DIRECTORY);
  fs.ensureDirSync(SUBMISSION_FILE_DIRECTORY);
  fs.ensureDirSync(THUMBNAIL_FILE_DIRECTORY);

  fs.ensureDirSync(TEMP_FILE_DIRECTORY);
  fs.emptyDirSync(TEMP_FILE_DIRECTORY); // Clear temp directory
}
