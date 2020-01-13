import { DefaultOptions } from './default-options.interface';
import { EntityIntf } from '../../../base/entity/entity.base.interface';

export interface SubmissionPart<T extends DefaultOptions> extends EntityIntf {
  data: T;
  accountId: string;
  submissionId: string;
  website: string;
  isDefault?: boolean;
  postedTo?: string;
  postStatus?: PostStatus;
}

export type PostStatus = 'SUCCESS' | 'FAILED' | 'UNPOSTED';
export type Parts = Record<string, SubmissionPart<any>>;
