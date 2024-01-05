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
  supportsAdditionalFiles: boolean = true;
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
      <Form.Item label="Label Rating">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.label_rating}
          onChange={this.setValue.bind(this, 'label_rating')}
        >
          <Select.Option value={''}>Suitable for all ages</Select.Option>
          <Select.Option value={'sexual'}>Adult: Suggestive</Select.Option>
          <Select.Option value={'nudity'}>Adult: Nudity</Select.Option>
          <Select.Option value={'porn'}>Adult: Porn</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Who can reply?">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.threadgate}
          onChange={this.setValue.bind(this, 'threadgate')}
        >
          <Select.Option value={''}>Everybody</Select.Option>
          <Select.Option value={'nobody'}>Nobody</Select.Option>
          <Select.Option value={'mention'}>Mentioned Users</Select.Option>
          <Select.Option value={'following'}>Followed Users</Select.Option>   
          <Select.Option value={'mention,following'}>Mentioned & Followed Users</Select.Option>     
        </Select>
      </Form.Item>,
      <Form.Item label="Reply To Post URL">
        <Input value={data.replyToUrl} onChange={this.handleValueChange.bind(this, 'replyToUrl')} />
      </Form.Item>
    );
    return elements;
  }
}

export class BlueskyFileSubmissionForm extends GenericFileSubmissionSection<BlueskyFileOptions> {
  renderLeftForm(data: BlueskyFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <Form.Item label="Label Rating">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.label_rating}
          onChange={this.setValue.bind(this, 'label_rating')}
        >
          <Select.Option value={''}>Suitable for all ages</Select.Option>
          <Select.Option value={'sexual'}>Adult: Suggestive</Select.Option>
          <Select.Option value={'nudity'}>Adult: Nudity</Select.Option>
          <Select.Option value={'porn'}>Adult: Porn</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Who can reply?">
      <Select
        {...GenericSelectProps}
        className="w-full"
        value={data.threadgate}
        onChange={this.setValue.bind(this, 'threadgate')}
      >
        <Select.Option value={''}>Everybody</Select.Option>
        <Select.Option value={'nobody'}>Nobody</Select.Option>
        <Select.Option value={'mention'}>Mentioned Users</Select.Option>
        <Select.Option value={'following'}>Followed Users</Select.Option>   
        <Select.Option value={'mention,following'}>Mentioned & Followed Users</Select.Option>     
      </Select>                  
    </Form.Item>,
      <Form.Item label="Fallback Alt Text">
        <Input
          value={data.altText}
          onChange={this.handleValueChange.bind(this, 'altText')}
        />
      </Form.Item>,
      <Form.Item label="Reply To Post URL">
        <Input value={data.replyToUrl} onChange={this.handleValueChange.bind(this, 'replyToUrl')} />
      </Form.Item>,
    );
    return elements;
  }
}
