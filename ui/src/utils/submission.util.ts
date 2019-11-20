import { SubmissionPackage } from '../../../electron-app/src/submission/interfaces/submission-package.interface';

export default class SubmissionUtil {
    static getFileSubmissionTitle(submissionPackage: SubmissionPackage<any>): string {
        return submissionPackage.parts.default.data.title || submissionPackage.submission.title;
    }
}