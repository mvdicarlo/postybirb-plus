import React from 'react';
import * as _ from 'lodash';
import { Checkbox } from 'antd';
import { DefaultFileOptions } from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import WebsiteFormSection from '../form-sections/WebsiteFormSection';

export default class GenericFileSubmissionSection<
  T extends DefaultFileOptions
> extends WebsiteFormSection<FileSubmission, T> {
  renderRightForm(data: T): JSX.Element[] {
    return [];
  }

  renderLeftForm(data: T): JSX.Element[] {
    const hideThumbnailOptions = !!this.props.hideThumbnailOptions;
    const elements = [
      <div>
        <Checkbox
          checked={data.autoScale}
          onChange={this.handleCheckedChange.bind(this, 'autoScale')}
        >
          Downscale images to fit size limit
        </Checkbox>
      </div>
    ];
    if (!hideThumbnailOptions) {
      elements.push(
        <div>
          <Checkbox
            checked={data.useThumbnail}
            onChange={this.handleCheckedChange.bind(this, 'useThumbnail')}
          >
            Use thumbnail (if provided)
          </Checkbox>
        </div>
      );
    }
    return elements;
  }
}
