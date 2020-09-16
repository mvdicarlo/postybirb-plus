import { Submission } from 'postybirb-commons';
import PersistedDatabase from 'src/server/database/databases/persisted.database';
import SubmissionEntity from './models/submission.entity';
import MemoryDatabase from 'src/server/database/databases/memory.database';

export const SubmissionRepositoryToken = 'SubmissionRepositoryToken';
export type SubmissionRepository =
  | PersistedDatabase<SubmissionEntity, Submission>
  | MemoryDatabase<SubmissionEntity, Submission>;
