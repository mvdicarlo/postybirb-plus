import { Submission } from './submission.interface';
import { PostStatus } from './submission-part.interface';

export interface PostStatuses {
  queued: Submission[];
  posting: PostInfo[];
}

export interface PostInfo {
  submission: Submission;
  statuses: PostInfoStatus[];
}

export interface PostInfoStatus {
  accountId: string;
  postAt: number;
  status: PostStatus;
  isPosting: boolean;
  waitingForCondition: boolean;
  website: string;
  source?: string;
  error?: string;
}
