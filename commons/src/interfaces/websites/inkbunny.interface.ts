import { DefaultFileOptions } from '../submission/default-options.interface';

export interface InkbunnyOptions extends DefaultFileOptions {
  blockGuests: boolean;
  friendsOnly: boolean;
  notify: boolean;
  scraps: boolean;
  submissionType?: string;
}
