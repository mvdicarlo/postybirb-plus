import { Submission } from 'src/submission/interfaces/submission.interface';

export interface PostStatus {
  queued: Submission[];
  posting: Array<{
    submission: Submission;
    status: Array<{
      done: boolean;
      postAt: number;
      success: boolean;
      waitingForCondition: boolean;
      website: string;
    }>;
  }>;
}
