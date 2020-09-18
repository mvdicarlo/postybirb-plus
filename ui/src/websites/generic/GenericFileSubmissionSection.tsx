import React from 'react';
import { Checkbox } from 'antd';
import { DefaultFileOptions } from 'postybirb-commons';
import { FileSubmission } from 'postybirb-commons';
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
