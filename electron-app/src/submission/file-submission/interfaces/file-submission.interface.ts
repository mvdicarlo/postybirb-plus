import { Submission } from '../../interfaces/submission.interface';
import { FileRecord } from './file-record.interface';

export interface FileSubmission extends Submission {
  primary: FileRecord;
  thumbnail?: FileRecord;
  additional?: FileRecord[];
}
