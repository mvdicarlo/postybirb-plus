import { SubmissionPackage } from '../../../electron-app/src/server/submission/interfaces/submission-package.interface';
import { Problems } from '../../../electron-app/src/server/submission/validator/interfaces/problems.interface';

export default class SubmissionUtil {
  static getSubmissionTitle(submissionPackage: SubmissionPackage<any>): string {
    return submissionPackage.parts.default.data.title || submissionPackage.submission.title;
  }

  static getProblemCount(problems: Problems): number {
    return Object.values(problems).flatMap(p => p.problems).length;
  }
}
