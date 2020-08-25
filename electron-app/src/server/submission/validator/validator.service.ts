import { Injectable } from '@nestjs/common';
import { WebsiteProvider } from 'src/server/websites/website-provider.service';
import { SubmissionPart } from '../submission-part/interfaces/submission-part.interface';
import { Submission } from '../interfaces/submission.interface';
import * as _ from 'lodash';
import { Problems } from './interfaces/problems.interface';
import { SubmissionType } from '../enums/submission-type.enum';
import { DefaultOptions } from '../submission-part/interfaces/default-options.interface';
import { ValidationParts } from './interfaces/validation-parts.interface';
import { Website } from 'src/server/websites/website.base';
import FileSubmissionEntity from '../file-submission/models/file-submission.entity';

@Injectable()
export class ValidatorService {
  constructor(private readonly websiteProvider: WebsiteProvider) {}

  validateParts(submission: Submission, parts: Array<SubmissionPart<any>>): Problems {
    const defaultPart: SubmissionPart<DefaultOptions> = parts.find(p => p.isDefault);
    const websiteProblems: Problems = {};
    parts
      .filter(p => !p.isDefault)
      .forEach(p => {
        websiteProblems[p.accountId] = {
          ...this.validatePart(submission, p, defaultPart),
          website: p.website,
          accountId: p.accountId,
        };
      });

    return {
      [defaultPart.accountId]: {
        ...this.validateDefaultPart(submission, defaultPart, parts),
        website: defaultPart.website,
        accountId: defaultPart.accountId,
      },
      ...websiteProblems,
    };
  }

  private validatePart(
    submission: Submission,
    part: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const website: Website = this.websiteProvider.getWebsiteModule(part.website);
    const parsedPart = this.parsePart(part, defaultPart);
    switch (submission.type) {
      case SubmissionType.FILE:
        return website.validateFileSubmission(
          submission as FileSubmissionEntity,
          parsedPart,
          defaultPart,
        );
      case SubmissionType.NOTIFICATION:
        return website.validateNotificationSubmission(submission, parsedPart, defaultPart);
    }
  }

  private validateDefaultPart(
    submission: Submission,
    defaultPart: SubmissionPart<DefaultOptions>,
    allParts: Array<SubmissionPart<any>>,
  ): ValidationParts {
    const problems: string[] = [];
    if (!defaultPart.data.rating) {
      problems.push('Please provide a rating.');
    }

    if (allParts.length <= 1) {
      problems.push('Please add one or more websites to post to.');
    }

    return { problems, warnings: [] };
  }

  private parsePart(
    part: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): SubmissionPart<any> {
    return _.cloneDeep(part);
  }
}
