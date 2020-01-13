import Entity from 'src/base/entity/entity.base';
import { SubmissionLog, PartWithResponse } from '../interfaces/submission-log.interface';
import { Submission } from '../../interfaces/submission.interface';
import { IsNotEmpty, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import SubmissionEntity from 'src/submission/models/submission.entity';

// Don't really care about validation here
export default class SubmissionLogEntity extends Entity implements SubmissionLog {
  @IsNotEmpty()
  submission: Submission;

  @IsArray()
  parts: PartWithResponse[];

  @IsString()
  @IsNotEmpty()
  version: string;

  constructor(partial: Partial<SubmissionLogEntity>) {
    super(partial);
  }
}
