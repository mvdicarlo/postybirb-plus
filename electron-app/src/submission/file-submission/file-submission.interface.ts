import { Submission } from '../submission.interface';
import { FileSubmissionType } from './enums/file-submission-type.enum';

// TODO change file locations to take additional files, thumbnail files and make sense of it
// maybe a list of files?
export interface FileSubmission extends Submission {
  originalFilename: string;
  type: FileSubmissionType;
  fileLocations: {
    originalPath: string;
    submission: string;
    thumbnail?: string;
    customThumbnail?: string;
  };
}
