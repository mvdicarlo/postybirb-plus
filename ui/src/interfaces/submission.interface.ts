import { FileSubmissionType } from "../enums/file-submission-type.enum";

export interface SubmissionDTO {
  id: string;
  title: string;
  order: number;
  created: number;
}

export interface FileSubmissionDTO extends SubmissionDTO {
  originalFilename: string;
  type: FileSubmissionType;
  fileLocations: {
    originalPath: string;
    submission: string;
    thumbnail: string;
    customThumbnail?: string;
  };
}
