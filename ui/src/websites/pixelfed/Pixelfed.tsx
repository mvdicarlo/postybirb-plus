import { Checkbox, Form, Input, Select } from 'antd';
import {
  FileSubmission,
  PixelfedFileOptions,
  Submission,
  SubmissionRating
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import PixelfedLogin from './PixelfedLogin';

export class Pixelfed extends WebsiteImpl {
  internalName: string = 'Pixelfed';
  name: string = 'Pixelfed Instance';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <PixelfedLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, PixelfedFileOptions>) => (
    <PixelfedFileSubmissionForm
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          { name: 'Safe', value: SubmissionRating.GENERAL },
          { name: 'Sensitive', value: SubmissionRating.ADULT }
        ]
      }}
      tagOptions={{ show: true, options: { showDisableAppending: true } }}
      hideThumbnailOptions={true}
    />
  );
}

export class PixelfedFileSubmissionForm extends GenericFileSubmissionSection<PixelfedFileOptions> {
  renderLeftForm(data: PixelfedFileOptions) {
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
