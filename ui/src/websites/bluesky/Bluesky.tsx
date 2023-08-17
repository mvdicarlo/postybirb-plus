import { Checkbox, Form, Input, Select } from 'antd';
import {
  FileSubmission,
  BlueskyFileOptions,
  BlueskyNotificationOptions,
  Submission,
  SubmissionRating
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import BlueskyLogin from './BlueskyLogin';

export class Bluesky extends WebsiteImpl {
  internalName: string = 'Bluesky';
  name: string = 'Bluesky';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <BlueskyLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, BlueskyFileOptions>) => (
    <BlueskyFileSubmissionForm
      key={props.part.accountId}
      {...props}
      tagOptions={{ show: true }}
      hideThumbnailOptions={true}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, BlueskyNotificationOptions>
  ) => (
    <BlueskyNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
      tagOptions={{ show: true }}
    />
  );
}

class BlueskyNotificationSubmissionForm extends GenericSubmissionSection<
BlueskyNotificationOptions
> {
  renderLeftForm(data: BlueskyNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
      </div>,
    );
    return elements;
  }
}

export class BlueskyFileSubmissionForm extends GenericFileSubmissionSection<BlueskyFileOptions> {
  renderLeftForm(data: BlueskyFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <Form.Item label="Alt Text">
        <Input
          value={data.altText}
          onChange={this.handleValueChange.bind(this, 'altText')}
        />
      </Form.Item>,
    );
    return elements;
  }
}
