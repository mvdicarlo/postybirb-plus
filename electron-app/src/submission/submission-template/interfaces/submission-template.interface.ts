import { SubmissionType } from '../../enums/submission-type.enum';
import { EntityIntf } from '../../../base/entity/entity.base.interface';
import { Parts } from 'src/submission/submission-part/interfaces/submission-part.interface';

export interface SubmissionTemplate extends EntityIntf {
  alias: string;
  type: SubmissionType;
  parts: Parts;
}
