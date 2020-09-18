import SubmissionPartEntity from './models/submission-part.entity';
import PersistedDatabase from 'src/server/database/databases/persisted.database';
import { SubmissionPart } from 'postybirb-commons';
import MemoryDatabase from 'src/server/database/databases/memory.database';

export const SubmissionPartRepositoryToken = 'SubmissionPartRepositoryToken';
export type SubmissionPartRepository =
  | PersistedDatabase<SubmissionPartEntity<any>, SubmissionPart<any>>
  | MemoryDatabase<SubmissionPartEntity<any>, SubmissionPart<any>>;
