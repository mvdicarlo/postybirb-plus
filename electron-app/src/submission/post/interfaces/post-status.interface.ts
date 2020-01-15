import { Submission } from 'src/submission/interfaces/submission.interface';

export interface PostStatuses {
  queued: Submission[];
  posting: PostInfo[];
}

export interface PostInfo {
  submission: Submission;
  statuses: Array<{
    accountId: string;
    done: boolean;
    postAt: number;
    success: boolean;
    waitingForCondition: boolean;
    website: string;
  }>;
}
