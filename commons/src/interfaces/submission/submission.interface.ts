import { SubmissionType } from '../../enums/submission-type.enum';
import { EntityIntf } from '../database/entity.interface';
import { SubmissionSchedule } from './submission-schedule.interface';

export interface Submission extends EntityIntf {
  isPosting?: boolean;
  isQueued?: boolean;
  schedule: SubmissionSchedule;
  sources: string[];
  title: string;
  type: SubmissionType;
  order: number;
}
