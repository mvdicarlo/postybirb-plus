import { DefaultOptions } from './default-options.interface';
import { EntityIntf } from '../database/entity.interface';

export interface SubmissionPart<T extends DefaultOptions> extends EntityIntf {
  data: T;
  accountId: string;
  submissionId: string;
  website: string;
  isDefault?: boolean;
  postedTo?: string;
  postStatus?: PostStatus;
}

export type PostStatus = 'SUCCESS' | 'FAILED' | 'UNPOSTED' | 'CANCELLED';
export type Parts = Record<string, SubmissionPart<any>>;
