import { PostData } from './post-data.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';

export interface FilePostData extends PostData<FileSubmission> {
  primary: PostFile;
  thumbnail?: PostFile;
  additional: PostFile[];
}

export interface PostFile {
  buffer: Buffer;
  options: {
    contentType: string;
    filename: string;
  };
}
