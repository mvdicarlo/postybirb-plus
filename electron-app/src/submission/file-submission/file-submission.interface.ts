import { Submission } from '../submission.interface';
import { FileRecord } from './interfaces/file-record.interface';

export interface FileSubmission extends Submission {
  primary: FileRecord;
  thumbnail?: FileRecord;
  additional?: FileRecord[];
}
