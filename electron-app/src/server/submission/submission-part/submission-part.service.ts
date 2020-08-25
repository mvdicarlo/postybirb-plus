import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  SubmissionPartRepository,
  SubmissionPartRepositoryToken,
} from './submission-part.repository';
import { WebsiteProvider } from 'src/server/websites/website-provider.service';
import { Submission } from '../interfaces/submission.interface';
import { SubmissionType } from '../enums/submission-type.enum';
import { DefaultOptions } from './interfaces/default-options.interface';
import { Website } from 'src/server/websites/website.base';
import SubmissionPartEntity from './models/submission-part.entity';

@Injectable()
export class SubmissionPartService {
  private readonly logger = new Logger(SubmissionPartService.name);

  constructor(
    @Inject(SubmissionPartRepositoryToken)
    private readonly repository: SubmissionPartRepository,
    private readonly websiteProvider: WebsiteProvider,
  ) {}

  async createOrUpdateSubmissionPart(
    part: SubmissionPartEntity<any>,
    submissionType: SubmissionType,
  ): Promise<SubmissionPartEntity<any>> {
    const copy = part.copy();

    let defaultData = {};
    if (!copy.isDefault) {
      const website: Website = this.websiteProvider.getWebsiteModule(copy.website);
      defaultData = website.getDefaultOptions(submissionType);
    }

    const existing = await this.repository.findOne(copy._id);
    if (existing) {
      this.logger.log(`${copy.submissionId}: ${copy.accountId}`, 'Update Submission Part');
      copy.data = {
        ...defaultData,
        ...existing.data,
        ...copy.data,
      };
      await this.repository.update(copy);
    } else {
      this.logger.log(copy.submissionId, 'Create Submission Part');
      copy.data = {
        ...defaultData,
        ...copy.data,
      };
      await this.repository.save(copy);
    }

    return copy;
  }

  async createDefaultPart(
    submission: Submission,
    title?: string,
  ): Promise<SubmissionPartEntity<DefaultOptions>> {
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

    return await this.repository.save(
      new SubmissionPartEntity({
        submissionId: submission._id,
        website: 'default',
        accountId: 'default',
        data: defaultPart,
        isDefault: true,
        postStatus: 'UNPOSTED',
      }),
    );
  }

  getPartsForSubmission(
    submissionId: string,
    incompleteOnly: boolean,
  ): Promise<Array<SubmissionPartEntity<any>>> {
    if (incompleteOnly) {
      return this.repository
        .find({ submissionId })
        .then(parts => parts.filter(part => part.postStatus !== 'SUCCESS'));
    }
    return this.repository.find({ submissionId });
  }

  async getSubmissionPart(
    submissionId: string,
    accountId: string,
  ): Promise<SubmissionPartEntity<any> | undefined> {
    return (await this.repository.find({ accountId, submissionId }))[0];
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
    return this.repository.removeBy({ accountId });
  }
}
