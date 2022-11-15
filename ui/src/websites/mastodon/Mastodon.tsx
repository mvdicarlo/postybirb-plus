import { Checkbox, Form, Input, Select } from 'antd';
import {
  FileSubmission,
  MastodonFileOptions,
  MastodonNotificationOptions,
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
import MastodonLogin from './MastodonLogin';

export class Mastodon extends WebsiteImpl {
  internalName: string = 'Mastodon';
  name: string = 'Mastodon Instance';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = false;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <MastodonLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, MastodonFileOptions>) => (
    <MastodonFileSubmissionForm
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          { name: 'Safe', value: SubmissionRating.GENERAL },
          { name: 'Sensitive', value: SubmissionRating.ADULT }
        ]
      }}
      tagOptions={{ show: false }}
      hideThumbnailOptions={true}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, MastodonNotificationOptions>
  ) => (
    <MastodonNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          { name: 'Safe', value: SubmissionRating.GENERAL },
          { name: 'Sensitive', value: SubmissionRating.ADULT }
        ]
      }}
      tagOptions={{ show: false }}
    />
  );
}

class MastodonNotificationSubmissionForm extends GenericSubmissionSection<
  MastodonNotificationOptions
> {
  renderLeftForm(data: MastodonNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.useTitle}
          onChange={this.handleCheckedChange.bind(this, 'useTitle')}
        >
          Use title
        </Checkbox>
      </div>,
      <Form.Item label="Spoiler Text">
        <Input
          value={data.spoilerText}
          onChange={this.handleValueChange.bind(this, 'spoilerText')}
        />
      </Form.Item>,
      <Form.Item label="Post Visibility">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.visibility}
          onSelect={this.setValue.bind(this, 'visibility')}
        >
          <Select.Option value="public">Public</Select.Option>
          <Select.Option value="unlisted">Unlisted</Select.Option>
          <Select.Option value="private">Followers Only</Select.Option>
          <Select.Option value="direct">Mentioned Users Only</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }
}

export class MastodonFileSubmissionForm extends GenericFileSubmissionSection<MastodonFileOptions> {
  renderLeftForm(data: MastodonFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.useTitle}
          onChange={this.handleCheckedChange.bind(this, 'useTitle')}
        >
          Use title
        </Checkbox>
      </div>,
      <Form.Item label="Spoiler Text">
        <Input
          value={data.spoilerText}
          onChange={this.handleValueChange.bind(this, 'spoilerText')}
        />
      </Form.Item>,
      <Form.Item label="Alt Text">
        <Input
          value={data.altText}
          onChange={this.handleValueChange.bind(this, 'altText')}
        />
      </Form.Item>,
      <Form.Item label="Post Visibility">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.visibility}
          onSelect={this.setValue.bind(this, 'visibility')}
        >
          <Select.Option value="public">Public</Select.Option>
          <Select.Option value="unlisted">Unlisted</Select.Option>
          <Select.Option value="private">Followers Only</Select.Option>
          <Select.Option value="direct">Mentioned Users Only</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }
}
