import { Injectable } from '@nestjs/common';
import { SubmissionTemplate } from 'postybirb-commons';
import PersistedDatabase from 'src/server/database/databases/persisted.database';
import SubmissionTemplateEntity from './models/submission-template.entity';
import MemoryDatabase from 'src/server/database/databases/memory.database';

export const SubmissionTemplateRepositoryToken = 'SubmissionTemplateRepositoryToken';
export type SubmissionTemplateRepository =
  | PersistedDatabase<SubmissionTemplateEntity, SubmissionTemplate>
  | MemoryDatabase<SubmissionTemplateEntity, SubmissionTemplate>;
