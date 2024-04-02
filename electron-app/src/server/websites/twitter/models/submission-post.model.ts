import { IsDefined } from 'class-validator';

export interface FileUpload {
  data: string; // base64
  filename: string;
  contentType: string; //mime
}

export interface RequestFile {
  value: Buffer;
  options: {
    filename: string;
    contentType: string;
  };
}

export class SubmissionPost<T> {
  @IsDefined()
  secret: string;

  @IsDefined()
  token: string;

  @IsDefined()
  readonly options: T;

  readonly tags: string[];
  readonly description: string;
  readonly rating: string;
  readonly files: FileUpload[];
  readonly title: string;

  constructor(partial: Partial<SubmissionPost<T>>) {
    this.files = [];
    this.tags = [];
    this.rating = 'general';
    this.title = '';
    this.description = '';

    Object.assign(this, partial);
  }

  getFilesforPost(): RequestFile[] {
    return this.files.map(file => ({
      value: Buffer.from(file.data, 'base64'),
      options: {
        filename: file.filename,
        contentType: file.contentType,
      },
    }));
  }
}
