import { SubmissionPart } from './submission-part.interface';
import { PostResponse } from './post-response.interface';
import { Submission } from './submission.interface';
import { EntityIntf } from '../database/entity.interface';

export interface SubmissionLog extends EntityIntf {
  submission: Submission;
  parts: PartWithResponse[];
  version: string;
}

export interface PartWithResponse {
  part: SubmissionPart<any>;
  response: PostResponse;
}
