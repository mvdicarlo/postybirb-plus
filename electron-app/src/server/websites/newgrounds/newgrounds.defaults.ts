import { NewgroundsFileOptions } from 'postybirb-commons';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const NewgroundsDefaultFileOptions: NewgroundsFileOptions = {
  ...GenericDefaultFileOptions,
  creativeCommons: true,
  modification: true,
  commercial: false,
  sketch: false,
  category: '1',
  nudity: undefined,
  violence: undefined,
  explicitText: undefined,
  adultThemes: undefined,
};
