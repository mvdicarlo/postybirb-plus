import { Submission } from '../submission.interface';

export interface FileSubmission extends Submission {
  originalFilename: string;
  fileLocations: {
    originalPath: string;
    submission: string;
    thumbnail: string;
    customThumbnail?: string;
  };
}
