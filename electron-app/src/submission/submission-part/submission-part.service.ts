import { Injectable } from '@nestjs/common';
import { SubmissionPartRepository } from './submission-part.repository';
import { SubmissionPart, DefaultOptions } from '../interfaces/submission-part.interface';
import { WebsiteProvider } from 'src/websites/website-provider.service';
import { SubmissionType, Submission } from '../submission.interface';
import { Website } from 'src/websites/interfaces/website.interface';

@Injectable()
export class SubmissionPartService {
  constructor(
    private readonly repository: SubmissionPartRepository,
    private readonly websiteProvider: WebsiteProvider,
  ) {}

  async createOrUpdateSubmissionPart(
    part: SubmissionPart<any>,
    submissionType: SubmissionType,
  ): Promise<SubmissionPart<any>> {
    let data;
    if (part.website !== 'default') {
      const website: Website = this.websiteProvider.getWebsiteModule(part.website);
      data = website.getDefaultOptions(submissionType);
    } else {
      data = part.data;
    }

    const existing = await this.repository.find(part.submissionId, part.accountId);
    if (existing) {
      Object.assign(data, existing.data);
      Object.assign(data, part.data);
      await this.repository.update(part.submissionId, part.accountId, data);
    } else {
      Object.assign(data, part.data);
      await this.repository.create({ ...part, data });
    }

    part.data = data;
    return part;
  }

  async createDefaultPart(submission: Submission): Promise<void> {
    const defaultPart: DefaultOptions = {
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
