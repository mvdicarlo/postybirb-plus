import { SubmissionType } from 'postybirb-commons';
import { UploadedFile } from 'src/server/file-manager/interfaces/uploaded-file.interface';
import { SubmissionPart } from '../submission-part/interfaces/submission-part.interface';

export interface SubmissionCreate {
  type: SubmissionType;
  title?: string;
  path?: string;
  file?: UploadedFile;
  parts?: string;
}
