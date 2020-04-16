import React from 'react';
import * as _ from 'lodash';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import { DefaultOptions } from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
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
