import { Injectable } from '@nestjs/common';
import { SubmissionTemplate } from './interfaces/submission-template.interface';
import PersistedDatabase from 'src/database/databases/persisted.database';
import SubmissionTemplateEntity from './models/submission-template.entity';
import MemoryDatabase from 'src/database/databases/memory.database';

export const SubmissionTemplateRepositoryToken = 'SubmissionTemplateRepositoryToken';
export type SubmissionTemplateRepository =
  | PersistedDatabase<SubmissionTemplateEntity, SubmissionTemplate>
  | MemoryDatabase<SubmissionTemplateEntity, SubmissionTemplate>;
