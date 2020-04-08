import { PostData } from './post-data.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import { DefaultFileOptions } from 'src/submission/submission-part/interfaces/default-options.interface';

export interface FilePostData<T extends DefaultFileOptions> extends PostData<FileSubmission, T> {
  primary: PostFileRecord;
  thumbnail?: PostFile;
  fallback?: PostFile;
  additional: Array<PostFileRecord>;
}

export interface PostFileRecord {
  type: FileSubmissionType;
  file: PostFile;
}

export interface PostFile {
  value: Buffer;
  options: {
    contentType: string;
    filename: string;
  };
}
