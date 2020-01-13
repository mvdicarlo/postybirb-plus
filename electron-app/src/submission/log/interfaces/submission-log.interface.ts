import { SubmissionPart } from '../../submission-part/interfaces/submission-part.interface';
import { PostResponse } from '../../post/interfaces/post-response.interface';
import { Submission } from '../../interfaces/submission.interface';
import { EntityIntf } from '../../../base/entity/entity.base.interface';

export interface SubmissionLog extends EntityIntf {
  submission: Submission;
  parts: PartWithResponse[];
  version: string;
}

export interface PartWithResponse {
  part: SubmissionPart<any>;
  response: PostResponse;
}
