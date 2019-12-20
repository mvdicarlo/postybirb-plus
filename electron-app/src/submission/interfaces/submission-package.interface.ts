import { Parts } from './submission-part.interface';
import { Problems } from '../validator/interfaces/problems.interface';

export interface SubmissionPackage<T> {
  submission: T;
  parts: Parts;
  problems: Problems;
}
