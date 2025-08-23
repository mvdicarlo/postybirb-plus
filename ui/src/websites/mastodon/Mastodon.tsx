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
import SpoilerTextInput from '../../views/submissions/submission-forms/form-components/SpoilerTextInput';

export class Mastodon extends WebsiteImpl {
  internalName: string = 'Mastodon';
  name: string = 'Mastodon Instance';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  supportsParentId: boolean = true;
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
      tagOptions={{ show: true }}
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
      tagOptions={{ show: true }}
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
      <SpoilerTextInput
        overwriteDefault={data.spoilerTextOverwrite}
        spoilerText={data.spoilerText}
        onChangeOverwriteDefault={this.setValue.bind(this, 'spoilerTextOverwrite')}
        onChangeSpoilerText={this.setValue.bind(this, 'spoilerText')}
      ></SpoilerTextInput>,
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
      </Form.Item>,
      <Form.Item label="Reply To Post URL">
        <Input value={data.replyToUrl} onChange={this.handleValueChange.bind(this, 'replyToUrl')} />
        <p>Will be filled with the URL of the parent submission.</p>
      </Form.Item>,
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
      <SpoilerTextInput
        overwriteDefault={data.spoilerTextOverwrite}
        spoilerText={data.spoilerText}
        onChangeOverwriteDefault={this.setValue.bind(this, 'spoilerTextOverwrite')}
        onChangeSpoilerText={this.setValue.bind(this, 'spoilerText')}
      ></SpoilerTextInput>,
      <Form.Item label="Fallback Alt Text">
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
      </Form.Item>,
      <Form.Item label="Reply To Post URL">
        <Input value={data.replyToUrl} onChange={this.handleValueChange.bind(this, 'replyToUrl')} />
        <p>Will be filled with the URL of the parent submission.</p>
      </Form.Item>,
    );
    return elements;
  }
}
