import { SubmissionPackage } from 'postybirb-commons';
import { Problems } from 'postybirb-commons';

export default class SubmissionUtil {
  static getSubmissionTitle(submissionPackage: SubmissionPackage<any>): string {
    return submissionPackage.parts.default.data.title || submissionPackage.submission.title;
  }

  static getProblemCount(problems: Problems): number {
    return Object.values(problems).flatMap(p => p.problems).length;
  }
}
