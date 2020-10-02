import { Form, Input } from 'antd';
import { DerpibooruFileOptions, FileSubmission } from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class Derpibooru extends WebsiteImpl {
  internalName: string = 'Derpibooru';
  name: string = 'Derpibooru';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = 'https://derpibooru.org/session/new';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DerpibooruFileOptions>) => (
    <DerpibooruFileSubmissionForm
      hideThumbnailOptions={true}
      key={props.part.accountId}
      {...props}
    />
  );
}

export class DerpibooruFileSubmissionForm extends GenericFileSubmissionSection<
  DerpibooruFileOptions
> {
  constructor(props: WebsiteSectionProps<FileSubmission, DerpibooruFileOptions>) {
    super(props);
    this.state = {
      folders: []
    };
  }

  renderRightForm(data: DerpibooruFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Source URL">
        <Input value={data.source || ''} onChange={this.handleValueChange.bind(this, 'source')} />
      </Form.Item>
    );
    return elements;
  }
}
