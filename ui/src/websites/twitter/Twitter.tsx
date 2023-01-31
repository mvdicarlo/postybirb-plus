import { Form, Radio } from 'antd';
import {
  DefaultFileOptions,
  DefaultOptions,
  FileSubmission,
  Submission,
  SubmissionRating,
  TwitterFileOptions
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import { TwitterLogin } from './TwitterLogin';

export class Twitter extends WebsiteImpl {
  internalName: string = 'Twitter';
  name: string = 'Twitter';
  supportsAdditionalFiles: boolean = true;
  supportsTags = false;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <TwitterLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, TwitterFileOptions>) => (
    <TwitterFileSubmissionForm
      key={props.part.accountId}
      {...props}
      hideThumbnailOptions={true}
      hideTitle={true}
      tagOptions={{ show: false }}
      descriptionOptions={{ show: true, options: { anchorLength: 23 } }}
      ratingOptions={{
        show: true,
        ratings: [
          { name: 'Safe', value: SubmissionRating.GENERAL },
          { name: 'Sensitive', value: SubmissionRating.ADULT }
        ]
      }}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      hideTitle={true}
      tagOptions={{ show: false }}
      descriptionOptions={{ show: true, options: { anchorLength: 23 } }}
      ratingOptions={{
        show: true,
        ratings: [
          { name: 'Safe', value: SubmissionRating.GENERAL },
          { name: 'Sensitive', value: SubmissionRating.ADULT }
        ]
      }}
    />
  );
}

export class TwitterFileSubmissionForm extends GenericFileSubmissionSection<TwitterFileOptions> {
  renderLeftForm(data: TwitterFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <Form.Item label="Content Blur">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'contentBlur')}
          value={data.contentBlur}
          buttonStyle="solid"
        >
          <Radio.Button value={undefined}>None</Radio.Button>
          <Radio.Button value="other">Other</Radio.Button>
          <Radio.Button value="adult_content">Adult Content</Radio.Button>
          <Radio.Button value="graphic_violence">Graphic Violence</Radio.Button>
        </Radio.Group>
      </Form.Item>
    );
    return elements;
  }

  renderRightForm(data: TwitterFileOptions) {
    const elements = super.renderRightForm(data);
    return elements;
  }
}
