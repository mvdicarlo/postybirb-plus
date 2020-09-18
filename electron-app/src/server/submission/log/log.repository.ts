import { SubmissionLog } from 'postybirb-commons';
import PersistedDatabase from 'src/server/database/databases/persisted.database';
import SubmissionLogEntity from './models/submission-log.entity';
import MemoryDatabase from 'src/server/database/databases/memory.database';

export const SubmissionLogRepositoryToken = 'SubmissionLogRepositoryToken';
export type SubmissionLogRepository =
  | PersistedDatabase<SubmissionLogEntity, SubmissionLog>
  | MemoryDatabase<SubmissionLogEntity, SubmissionLog>;
