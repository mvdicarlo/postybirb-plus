import { PostData } from './post-data.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';

export interface FilePostData extends PostData<FileSubmission> {
  primary: {
    type: FileSubmissionType;
    file: PostFile;
  };
  thumbnail?: PostFile;
  additional: Array<{
    type: FileSubmissionType;
    file: PostFile;
  }>;
}

export interface PostFile {
  buffer: Buffer;
  options: {
    contentType: string;
    filename: string;
  };
}
