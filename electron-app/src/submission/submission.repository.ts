import { Submission } from './interfaces/submission.interface';
import PersistedDatabase from 'src/database/databases/persisted.database';
import SubmissionEntity from './models/submission.entity';
import MemoryDatabase from 'src/database/databases/memory.database';

export const SubmissionRepositoryToken = 'SubmissionRepositoryToken';
export type SubmissionRepository =
  | PersistedDatabase<SubmissionEntity, Submission>
  | MemoryDatabase<SubmissionEntity, Submission>;
