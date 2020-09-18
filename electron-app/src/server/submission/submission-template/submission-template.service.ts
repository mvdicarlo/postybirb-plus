import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import * as _ from 'lodash';
import {
  SubmissionTemplateRepository,
  SubmissionTemplateRepositoryToken,
} from './submission-template.repository';
import { EventsGateway } from 'src/server/events/events.gateway';
import { Events } from 'postybirb-commons';
import { CreateSubmissionTemplateModel } from './models/create-template.model';
import { UpdateSubmissionTemplateModel } from './models/update-template.model';
import { SubmissionTemplate, DefaultOptions, Parts } from 'postybirb-commons';

import SubmissionTemplateEntity from './models/submission-template.entity';

import SubmissionPartEntity from '../submission-part/models/submission-part.entity';

@Injectable()
export class SubmissionTemplateService {
  private readonly logger = new Logger(SubmissionTemplateService.name);

  constructor(
    @Inject(SubmissionTemplateRepositoryToken)
    private readonly repository: SubmissionTemplateRepository,
    private readonly eventEmitter: EventsGateway,
  ) {}

  async get(id: string) {
    const template = await this.repository.findOne(id);
    if (!template) {
      throw new NotFoundException(`Submission template ${id} does not exist.`);
    }

    return template;
  }

  getAll() {
    return this.repository.find();
  }

  async create(createDto: CreateSubmissionTemplateModel): Promise<SubmissionTemplate> {
    this.logger.log(createDto, 'Create Submission Template');

    const defaultPart: DefaultOptions = {
      title: '',
      rating: null,
      description: {
        overwriteDefault: false,
        value: '',
      },
      tags: {
        extendDefault: true,
        value: [],
      },
    };

    const template: SubmissionTemplateEntity = new SubmissionTemplateEntity({
      alias: createDto.alias.trim(),
      type: createDto.type,
      parts: {},
    });

    template.parts.default = new SubmissionPartEntity({
      submissionId: template._id,
      website: 'default',
      accountId: 'default',
      data: defaultPart,
      isDefault: true,
      postStatus: 'UNPOSTED',
    });

    const createdTemplate = await this.repository.save(template);
    this.eventEmitter.emit(Events.SubmissionTemplateEvent.CREATED, createdTemplate);
    return createdTemplate;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(id, 'Delete Submission Template');
    await this.repository.remove(id);
    this.eventEmitter.emit(Events.SubmissionTemplateEvent.REMOVED, id);
  }

  async update(updateDto: UpdateSubmissionTemplateModel): Promise<SubmissionTemplate> {
    this.logger.log(updateDto.id, 'Update Submission Template');
    const templateToUpdate = await this.get(updateDto.id);
    const newParts: Parts = {};
    Object.entries(updateDto.parts).forEach(([key, value]) => {
      const { data, accountId, submissionId, website, isDefault } = value;
      newParts[key] = new SubmissionPartEntity({
        data,
        accountId,
        submissionId,
        website,
        isDefault,
      });
    });
    templateToUpdate.parts = newParts;
    await this.repository.update(templateToUpdate);
    this.eventEmitter.emit(Events.SubmissionTemplateEvent.UPDATED, templateToUpdate);
    return templateToUpdate;
  }

  async updateAlias(id: string, alias: string): Promise<SubmissionTemplate> {
    const templateToUpdate = await this.get(id);
    this.logger.verbose(
      `[${id}] ${templateToUpdate.alias} -> ${alias}`,
      'Rename Submission Template',
    );
    templateToUpdate.alias = alias.trim();
    await this.repository.update(templateToUpdate);
    this.eventEmitter.emit(Events.SubmissionTemplateEvent.UPDATED, templateToUpdate);
    return templateToUpdate;
  }

  async removePartsForAccount(accountId: string): Promise<void> {
    this.logger.log(accountId, 'Delete Submission Template Parts For Account');
    const all = await this.getAll();
    all.forEach(async template => {
      if (template.parts[accountId]) {
        if (template.parts[accountId]) {
          delete template.parts[accountId];
          await this.repository.update(template);
          this.eventEmitter.emit(Events.SubmissionTemplateEvent.UPDATED, template);
        }
      }
    });
  }
}
