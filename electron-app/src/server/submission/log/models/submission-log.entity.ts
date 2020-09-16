import Entity from 'src/server/database/models/entity.model';
import {
  SubmissionLog,
  PartWithResponse,
  Submission,
  DefaultOptions,
  SubmissionPart,
} from 'postybirb-commons';

import { IsNotEmpty, IsArray, IsString } from 'class-validator';
import { SubmissionType } from 'postybirb-commons';

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
