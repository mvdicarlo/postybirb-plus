import { Form, Input } from 'antd';
import { ManebooruFileOptions, FileSubmission } from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class Manebooru extends WebsiteImpl {
  internalName: string = 'Manebooru';
  name: string = 'Manebooru';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = 'https://manebooru.org/session/new';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, ManebooruFileOptions>) => (
    <ManebooruFileSubmissionForm
      hideThumbnailOptions={true}
      key={props.part.accountId}
      {...props}
    />
  );
}

export class ManebooruFileSubmissionForm extends GenericFileSubmissionSection<
  ManebooruFileOptions
> {
  constructor(props: WebsiteSectionProps<FileSubmission, ManebooruFileOptions>) {
    super(props);
    this.state = {
      folders: []
    };
  }

  renderRightForm(data: ManebooruFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Source URL">
        <Input value={data.source || ''} onChange={this.handleValueChange.bind(this, 'source')} />
      </Form.Item>
    );
    return elements;
  }
}
