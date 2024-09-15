import { Injectable } from '@nestjs/common';
import { WebsiteProvider } from 'src/server/websites/website-provider.service';
import { SubmissionPart, Submission, Problems, DefaultOptions } from 'postybirb-commons';

import _ from 'lodash';

import { SubmissionType } from 'postybirb-commons';

import { ValidationParts } from './interfaces/validation-parts.interface';
import { Website } from 'src/server/websites/website.base';
import FileSubmissionEntity from '../file-submission/models/file-submission.entity';
import { ParserService } from '../parser/parser.service';

@Injectable()
export class ValidatorService {
  constructor(
    private readonly websiteProvider: WebsiteProvider,
    private readonly parserService: ParserService,
  ) {}

  async validateParts(
    submission: Submission,
    parts: Array<SubmissionPart<any>>,
  ): Promise<Problems> {
    const defaultPart: SubmissionPart<DefaultOptions> = parts.find(p => p.isDefault);
    const websiteProblems: Problems = {};
    for (const p of parts) {
      if (!p.isDefault) {
        websiteProblems[p.accountId] = {
          ...(await this.validatePart(submission, p, defaultPart)),
          website: p.website,
          accountId: p.accountId,
        };
      }
    }

    return {
      [defaultPart.accountId]: {
        ...this.validateDefaultPart(submission, defaultPart, parts),
        website: defaultPart.website,
        accountId: defaultPart.accountId,
      },
      ...websiteProblems,
    };
  }

  private async validatePart(
    submission: Submission,
    part: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): Promise<ValidationParts> {
    const website: Website = this.websiteProvider.getWebsiteModule(part.website);
    const parsedPart = this.parsePart(part, defaultPart);
    const description = await this.parserService.parseDescription(
      website,
      defaultPart,
      part,
      submission.type,
      false,
    );
    switch (submission.type) {
      case SubmissionType.FILE:
        return website.validateFileSubmission(
          submission as FileSubmissionEntity,
          parsedPart,
          defaultPart,
          description,
        );
      case SubmissionType.NOTIFICATION:
        return website.validateNotificationSubmission(
          submission,
          parsedPart,
          defaultPart,
          description,
        );
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
