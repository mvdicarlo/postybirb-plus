import { AryionFileOptions } from 'postybirb-commons';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const AryionDefaultFileOptions: AryionFileOptions = {
  ...GenericDefaultFileOptions,
  folder: [],
  viewPermissions: 'ALL',
  commentPermissions: 'USER',
  tagPermissions: 'USER',
  requiredTag: undefined,
  scraps: false,
};
