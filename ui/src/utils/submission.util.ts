import { SubmissionPackage } from '../../../electron-app/src/submission/interfaces/submission-package.interface';

export default class SubmissionUtil {
  static getFileSubmissionTitle(submissionPackage: SubmissionPackage<any>): string {
    return submissionPackage.parts.default.data.title || submissionPackage.submission.title;
  }

  static getProblemCount(submissionPackage: SubmissionPackage<any>): number {
    let count = 0;
    Object.values(submissionPackage.problems).forEach(
      problem => (count += problem.problems.length)
    );
    return count;
  }
}
