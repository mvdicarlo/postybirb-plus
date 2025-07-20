import { Checkbox, Form, Input, Select } from 'antd';
import {
  FileSubmission,
  PleromaFileOptions,
  PleromaNotificationOptions,
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
import PleromaLogin from './PleromaLogin';
import SpoilerTextInput from '../../views/submissions/submission-forms/form-components/SpoilerTextInput';

export class Pleroma extends WebsiteImpl {
  internalName: string = 'Pleroma';
  name: string = 'Pleroma Instance';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  supportsParentId: boolean = true;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <PleromaLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, PleromaFileOptions>) => (
    <PleromaFileSubmissionForm
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
    props: WebsiteSectionProps<Submission, PleromaNotificationOptions>
  ) => (
    <PleromaNotificationSubmissionForm
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

class PleromaNotificationSubmissionForm extends GenericSubmissionSection<
  PleromaNotificationOptions> {
  renderLeftForm(data: PleromaNotificationOptions) {
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

export class PleromaFileSubmissionForm extends GenericFileSubmissionSection<PleromaFileOptions> {
  renderLeftForm(data: PleromaFileOptions) {
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
      </Form.Item>,
      <Form.Item label="Reply To Post URL">
        <Input value={data.replyToUrl} onChange={this.handleValueChange.bind(this, 'replyToUrl')} />
        <p>Will be filled with the URL of the parent submission.</p>
      </Form.Item>,
    );
    return elements;
  }
}
