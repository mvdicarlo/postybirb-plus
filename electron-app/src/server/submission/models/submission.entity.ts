import Entity from 'src/server/database/models/entity.model';
import { Submission } from 'postybirb-commons';
import { SubmissionType } from 'postybirb-commons';
import {
  IsBoolean,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import SubmissionScheduleModel from './submission-schedule.model';

export default class SubmissionEntity extends Entity implements Submission {
  @IsBoolean()
  @IsOptional()
  isPosting: boolean;

  @IsBoolean()
  @IsOptional()
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
