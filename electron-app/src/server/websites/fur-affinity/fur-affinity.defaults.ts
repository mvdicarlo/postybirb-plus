import { FurAffinityFileOptions, FurAffinityNotificationOptions } from 'postybirb-commons';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';

export const FurAffinityDefaultFileOptions: FurAffinityFileOptions = {
  ...GenericDefaultFileOptions,
  category: '1',
  disableComments: false,
  folders: [],
  gender: '0',
  reupload: true,
  scraps: false,
  species: '1',
  theme: '1',
};

export const FurAffinityDefaultNotificationOptions: FurAffinityNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  feature: true,
};
