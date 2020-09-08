import { FileSubmissionType } from 'postybirb-commons';

export interface FileRecord {
  location: string;
  mimetype: string;
  name: string;
  order?: number;
  originalPath?: string;
  preview: string;
  size: number;
  type: FileSubmissionType;
  ignoredAccounts?: string[];
  buffer?: Buffer;
}
