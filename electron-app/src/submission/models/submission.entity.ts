import Entity from 'src/database/models/entity.model';
import { Submission } from '../interfaces/submission.interface';
import { SubmissionType } from '../enums/submission-type.enum';
import { IsBoolean, IsString, IsEnum, IsArray, ValidateNested, IsNotEmpty, IsNumber } from 'class-validator';
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

  @IsNumber()
  order: number;

  constructor(partial: Partial<SubmissionEntity>) {
    super(partial);
  }
}
