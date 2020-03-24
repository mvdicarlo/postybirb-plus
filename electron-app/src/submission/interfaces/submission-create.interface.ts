import { SubmissionType } from '../enums/submission-type.enum';
import { UploadedFile } from 'src/file-manager/interfaces/uploaded-file.interface';
import { SubmissionPart } from '../submission-part/interfaces/submission-part.interface';

export interface SubmissionCreate {
  type: SubmissionType;
  title?: string;
  path?: string;
  file?: UploadedFile;
  parts?: string;
}
