import * as path from 'path';
import { app } from 'electron';

export const BASE_DIRECTORY = `${app.getPath('documents')}/PostyBirb`;
export const SUBMISSION_FILE_DIRECTORY = path.join(
  BASE_DIRECTORY,
  'submission_files',
);
export const THUMBNAIL_FILE_DIRECTORY = path.join(
  BASE_DIRECTORY,
  'thumbnail_files',
);
export const DATABASE_DIRECTORY = path.join(BASE_DIRECTORY, 'data');
