import { Injectable } from '@nestjs/common';
import { WebsiteProvider } from 'src/websites/website-provider.service';
import { SubmissionPart, DefaultOptions } from '../interfaces/submission-part.interface';
import { SubmissionType, Submission } from '../submission.interface';
import { Website } from 'src/websites/interfaces/website.interface';
import * as _ from 'lodash';

@Injectable()
export class ValidatorService {
  constructor(private readonly websiteProvider: WebsiteProvider) {}

  validateParts(
    submission: Submission,
    parts: Array<SubmissionPart<any>>,
  ): { [key: string]: string[] } {
    const defaultPart: DefaultOptions = parts.find(p => p.website === 'default').data;
    const websiteProblems = {};
    parts
      .filter(p => p.website !== 'default')
      .forEach(p => {
        websiteProblems[p.accountId] = this.validatePart(submission, p, defaultPart);
      });

    return {
      default: this.validateDefaultPart(submission, defaultPart),
      ...websiteProblems,
    };
  }

  private validatePart(
    submission: Submission,
    part: SubmissionPart<any>,
    defaultPart: DefaultOptions,
  ): string[] {
    const website: Website = this.websiteProvider.getWebsiteModule(part.website);
    const parsedPart = this.parsePart(part, defaultPart);
    switch (submission.type) {
      case SubmissionType.FILE:
        return website.validateFileSubmission(submission, parsedPart);
      case SubmissionType.STATUS:
        return website.validateStatusSubmission(submission, parsedPart);
    }
  }

  private validateDefaultPart(submission: Submission, defaultPart: DefaultOptions): string[] {
      const problems: string[] = [];
      if (!defaultPart.rating) {
          problems.push('Please provide a rating.');
      }

      return problems;
  }

  private parsePart(part: SubmissionPart<any>, defaultPart: DefaultOptions): SubmissionPart<any> {
    const extendTags: boolean = _.get(part, 'tags.extendDefault', true);
    const overwriteDescription: boolean = _.get(part, 'description.overwriteDefault', false);

    const copy = _.cloneDeep(part);
    if (!overwriteDescription) {
      _.set(copy.data, 'description.value', defaultPart.description.value);
    }

    if (extendTags) {
      _.set(copy.data, 'tags.value', [
        ..._.get(copy, 'data.tags.value', []),
        ...defaultPart.tags.value,
      ]);
    }

    return copy;
  }
}
