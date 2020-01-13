import Entity from 'src/base/entity/entity.base';
import { Submission } from '../interfaces/submission.interface';
import { SubmissionType } from '../enums/submission-type.enum';
import { IsBoolean, IsString, IsEnum, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import SubmissionScheduleModel from './submission-schedule.model';

export default class SubmissionEntity extends Entity implements Submission {
  @IsBoolean()
  @IsNotEmpty()
  isPosting: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isQueued: boolean;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => SubmissionScheduleModel)
  schedule: SubmissionScheduleModel;

  @IsArray()
  sources: string[];

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(SubmissionType)
  @IsNotEmpty()
  type: SubmissionType;

  constructor(partial: Partial<SubmissionEntity>) {
    super(partial);
  }
}
