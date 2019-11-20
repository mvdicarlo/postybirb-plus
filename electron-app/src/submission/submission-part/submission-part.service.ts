import { Injectable, Logger } from '@nestjs/common';
import { SubmissionPartRepository } from './submission-part.repository';
import { SubmissionPart, DefaultOptions } from '../interfaces/submission-part.interface';
import { WebsiteProvider } from 'src/websites/website-provider.service';
import { SubmissionType, Submission } from '../interfaces/submission.interface';
import { Website } from 'src/websites/interfaces/website.interface';
import * as _ from 'lodash';

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
    if (copy.website !== 'default') {
      const website: Website = this.websiteProvider.getWebsiteModule(copy.website);
      defaultData = website.getDefaultOptions(submissionType);
    }

    let update = {};

    const existing = await this.repository.find(copy.submissionId, copy.accountId);
    if (existing) {
      update = {
        ...defaultData,
        ...existing.data,
        ...copy.data,
      };
      await this.repository.update(copy.submissionId, copy.accountId, update);
    } else {
      update = {
        ...defaultData,
        ...copy.data,
      };
      await this.repository.create({
        ...copy,
        data: update,
      });
    }

    copy.data = update;
    return copy;
  }

  async createDefaultPart(submission: Submission, title?: string): Promise<void> {
    const defaultPart: DefaultOptions = {
      title,
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
      submissionId: submission.id,
      website: 'default',
      accountId: 'default',
      data: defaultPart,
    });
  }

  getPartsForSubmission(submissionId: string): Promise<Array<SubmissionPart<any>>> {
    return this.repository.findAllBySubmissionId(submissionId);
  }

  removeSubmissionPart(submissionId: string, accountId: string): Promise<number> {
    return this.repository.remove(submissionId, accountId);
  }

  removeAllSubmissionPartsForAccount(accountId: string): Promise<number> {
    return this.repository.removeByAccountId(accountId);
  }
}
