import { SubmissionType } from '../../enums/submission-type.enum';
import { EntityIntf } from '../database/entity.interface';
import { Parts } from './submission-part.interface';

export interface SubmissionTemplate extends EntityIntf {
  alias: string;
  type: SubmissionType;
  parts: Parts;
}
