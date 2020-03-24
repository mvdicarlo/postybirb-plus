import SubmissionPartEntity from './models/submission-part.entity';
import PersistedDatabase from 'src/database/databases/persisted.database';
import { SubmissionPart } from './interfaces/submission-part.interface';
import MemoryDatabase from 'src/database/databases/memory.database';

export const SubmissionPartRepositoryToken = 'SubmissionPartRepositoryToken';
export type SubmissionPartRepository =
  | PersistedDatabase<SubmissionPartEntity<any>, SubmissionPart<any>>
  | MemoryDatabase<SubmissionPartEntity<any>, SubmissionPart<any>>;
