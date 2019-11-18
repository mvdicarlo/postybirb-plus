import { SubmissionPart } from './submission-part.interface';

export interface SubmissionPackage<T> {
  submission: T;
  parts: Array<SubmissionPart<any>>;
  problems: { [key: string]: any };
}
