import { Form, Input } from 'antd';
import { FurbooruFileOptions, FileSubmission } from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class Furbooru extends WebsiteImpl {
  internalName: string = 'Furbooru';
  name: string = 'Furbooru';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = 'https://furbooru.org/session/new';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, FurbooruFileOptions>) => (
    <FurbooruFileSubmissionForm
      hideThumbnailOptions={true}
      key={props.part.accountId}
      tagOptions={{
        show: true,
        options: {
          minTags: 5
        }
      }}
      {...props}
    />
  );
}

export class FurbooruFileSubmissionForm extends GenericFileSubmissionSection<FurbooruFileOptions> {
  constructor(props: WebsiteSectionProps<FileSubmission, FurbooruFileOptions>) {
    super(props);
    this.state = {
      folders: []
    };
  }

  renderRightForm(data: FurbooruFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Source URL">
        <Input value={data.source || ''} onChange={this.handleValueChange.bind(this, 'source')} />
      </Form.Item>
    );
    return elements;
  }
}
