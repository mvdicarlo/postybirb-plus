import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface InkbunnyOptions extends DefaultFileOptions {
  blockGuests: boolean;
  friendsOnly: boolean;
  notify: boolean;
  scraps: boolean;
  submissionType?: string;
}
