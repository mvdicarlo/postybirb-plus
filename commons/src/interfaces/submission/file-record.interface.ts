import { FileSubmissionType } from '../../enums/file-submission-type.enum';

export interface FileRecord {
  location: string;
  mimetype: string;
  name: string;
  order?: number;
  originalPath?: string;
  preview: string;
  size: number;
  height?: number;
  width?: number;
  type: FileSubmissionType;
  ignoredAccounts?: string[];
  buffer?: Buffer;
}
