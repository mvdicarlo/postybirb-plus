import { Submission } from 'postybirb-commons';
import { DefaultOptions } from 'postybirb-commons';
import WebsiteFormSection from '../form-sections/WebsiteFormSection';

export default class GenericSubmissionSection<T extends DefaultOptions> extends WebsiteFormSection<
  Submission,
  T
> {
  renderLeftForm(data: T): JSX.Element[] {
    return [];
  }
  renderRightForm(data: T): JSX.Element[] {
    return [];
  }
}
