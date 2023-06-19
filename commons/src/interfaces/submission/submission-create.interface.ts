import { SubmissionType } from '../../enums/submission-type.enum';
import { UploadedFile } from '../file-manager/uploaded-file.interface';

export interface SubmissionCreate {
  type: SubmissionType;
  title?: string;
  path?: string;
  file?: UploadedFile;
  parts?: string;
  thumbnailPath?: string;
  thumbnailFile?: UploadedFile;
}
