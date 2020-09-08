import { SubmissionType } from 'postybirb-commons';
import { EntityIntf } from '../../../database/interfaces/entity.interface';
import { Parts } from 'src/server/submission/submission-part/interfaces/submission-part.interface';

export interface SubmissionTemplate extends EntityIntf {
  alias: string;
  type: SubmissionType;
  parts: Parts;
}
