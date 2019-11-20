import { SubmissionPart } from './submission-part.interface';

export interface SubmissionPackage<T> {
  submission: T;
  parts: { [key: string]: SubmissionPart<any> };
  problems: { [key: string]: any };
}
