import { Injectable, Logger } from '@nestjs/common';
import { SubmissionPartRepository } from './submission-part.repository';
import { SubmissionPart } from '../interfaces/submission-part.interface';
import { WebsiteProvider } from 'src/websites/website-provider.service';
import { Submission } from '../interfaces/submission.interface';
import { Website } from 'src/websites/interfaces/website.interface';
import * as _ from 'lodash';
import { SubmissionType } from '../enums/submission-type.enum';
import { DefaultOptions } from '../interfaces/default-options.interface';

@Injectable()
export class SubmissionPartService {
  private readonly logger = new Logger(SubmissionPartService.name);

  constructor(
    private readonly repository: SubmissionPartRepository,
    private readonly websiteProvider: WebsiteProvider,
  ) {}

  async createOrUpdateSubmissionPart(
    part: SubmissionPart<any>,
    submissionType: SubmissionType,
  ): Promise<SubmissionPart<any>> {
    const copy = _.cloneDeep(part);
    let defaultData = {};
    if (!copy.isDefault) {
      const website: Website = this.websiteProvider.getWebsiteModule(copy.website);
      defaultData = website.getDefaultOptions(submissionType);
    }

    let update = {};

    const existing = await this.repository.find(this.getPartId(part.submissionId, copy.accountId));
    if (existing) {
      this.logger.log(`${copy.submissionId}: ${copy.accountId}`, 'Update Submission Part');
      update = {
        ...defaultData,
        ...existing.data,
        ...copy.data,
      };
      await this.repository.update(copy.id, update);
    } else {
      this.logger.log(copy.submissionId, 'Create Submission Part');
      update = {
        ...defaultData,
        ...copy.data,
      };
      await this.repository.create({
        ...copy,
        data: update,
        id: this.getPartId(copy.submissionId, copy.accountId),
      });
    }

    copy.data = update;
    return copy;
  }

  async createDefaultPart(submission: Submission, title?: string): Promise<void> {
    const defaultPart: DefaultOptions = {
      title: title || submission.title,
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

    await this.repository.create({
      id: this.getPartId(submission.id, 'default'),
      submissionId: submission.id,
      website: 'default',
      accountId: 'default',
      data: defaultPart,
      isDefault: true,
    });
  }

  getPartsForSubmission(submissionId: string): Promise<Array<SubmissionPart<any>>> {
    return this.repository.findAllBySubmissionId(submissionId);
  }

  async getSubmissionPart(
    submissionId: string,
    accountId: string,
  ): Promise<SubmissionPart<any> | undefined> {
    return (await this.repository.findAll({ accountId, submissionId }))[0];
  }

  getPartId(submissionId: string, accountId: string) {
    return `${submissionId}-${accountId}`;
  }

  removeSubmissionPart(id: string): Promise<number> {
    this.logger.log(id, 'Remove Submission Part');
    return this.repository.remove(id);
  }

  removeBySubmissionId(submissionId: string): Promise<number> {
    this.logger.log(submissionId, 'Remove Submission Parts From Submission');
    return this.repository.removeBy({ submissionId });
  }

  removeAllSubmissionPartsForAccount(accountId: string): Promise<number> {
    this.logger.log(accountId, 'Remove All Parts For Account');
    return this.repository.removeByAccountId(accountId);
  }
}
