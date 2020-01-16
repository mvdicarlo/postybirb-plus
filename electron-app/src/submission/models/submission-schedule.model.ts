import { SubmissionSchedule } from '../interfaces/submission-schedule.interface';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export default class SubmissionScheduleModel implements SubmissionSchedule {
  @IsBoolean()
  @IsOptional()
  isScheduled: boolean;

  @IsOptional()
  @IsNumber()
  postAt: number;

  constructor(partial?: Partial<SubmissionScheduleModel>) {
    Object.assign(this, partial);
  }
}
