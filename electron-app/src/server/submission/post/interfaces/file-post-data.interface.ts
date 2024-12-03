import { PostData } from './post-data.interface';
import { FileSubmission, DefaultFileOptions } from 'postybirb-commons';
import { FileSubmissionType } from 'postybirb-commons';

export interface FilePostData<T extends DefaultFileOptions> extends PostData<FileSubmission, T> {
  primary: PostFileRecord;
  thumbnail?: PostFile;
  fallback?: PostFile;
  additional: Array<PostFileRecord>;
}

export interface PostFileRecord {
  type: FileSubmissionType;
  file: PostFile;
  altText: string;
}

export interface PostFile {
  value: Buffer;
  options: {
    contentType: string;
    filename: string;
    height?: number;
    width?: number;
  };
}
