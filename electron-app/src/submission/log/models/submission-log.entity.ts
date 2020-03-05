import Entity from 'src/database/models/entity.model';
import { SubmissionLog, PartWithResponse } from '../interfaces/submission-log.interface';
import { Submission } from '../../interfaces/submission.interface';
import { IsNotEmpty, IsArray, IsString } from 'class-validator';
import { SubmissionType } from 'src/submission/enums/submission-type.enum';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';

// Don't really care about validation here
export default class SubmissionLogEntity extends Entity implements SubmissionLog {
  @IsNotEmpty()
  submission: Submission;

  @IsArray()
  parts: PartWithResponse[];

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsNotEmpty()
  defaultPart: SubmissionPart<DefaultOptions>;

  constructor(partial: Partial<SubmissionLogEntity>) {
    super(partial);
  }
}
