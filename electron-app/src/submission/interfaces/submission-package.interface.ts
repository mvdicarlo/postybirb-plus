import { SubmissionPart } from './submission-part.interface';
import { Problems } from '../validator/interfaces/problems.interface';

export interface SubmissionPackage<T> {
  submission: T;
  parts: { [key: string]: SubmissionPart<any> }; // key is part.accountId
  problems: Problems;
}
