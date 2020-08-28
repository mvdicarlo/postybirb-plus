import { InkbunnyOptions } from './inkbunny.interface';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const InkbunnyDefaultFileOptions: InkbunnyOptions = {
  ...GenericDefaultFileOptions,
  blockGuests: false,
  friendsOnly: false,
  notify: true,
  scraps: false,
  submissionType: undefined,
};
