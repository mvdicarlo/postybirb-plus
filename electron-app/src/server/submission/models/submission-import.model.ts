import { IsString } from 'class-validator';
import { SubmissionImport } from 'postybirb-commons';

export default class SubmissionImportModel implements SubmissionImport {
  @IsString()
  path: string;

  constructor(partial?: Partial<SubmissionImportModel>) {
    Object.assign(this, partial);
  }
}
