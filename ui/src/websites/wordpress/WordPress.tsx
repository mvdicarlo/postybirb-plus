import { Checkbox, Form, Input, Select } from 'antd';
import {
  FileSubmission,
  WordPressFileOptions,
  WordPressNotificationOptions,
  Submission,
  SubmissionRating
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';
import { LoginDialogProps } from '../interfaces/website.interface';
import WordPressAccountInfo from './WordPressAccountInfo';

export class WordPress extends WebsiteImpl {
  internalName: string = 'WordPress';
  name: string = 'WordPress Instance';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = false;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <WordPressAccountInfo {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, WordPressFileOptions>) => (
    <WordPressFileSubmissionForm
      key={props.part.accountId}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, WordPressNotificationOptions>
  ) => (
    <WordPressNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
    />
  );
}

// TODO: implement options
// slug (string)
// comment status (open/close)
// format (standard, aside, chat, gallery, link, image, quote, status, video, audio)
// categories (string input)
// status (publish, future, draft, pending [review], private)
// sticky (boolean)
class WordPressNotificationSubmissionForm extends GenericSubmissionSection<
  WordPressNotificationOptions
> {
  renderLeftForm(data: WordPressNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
      </div>,
      <Form.Item label="Post slug">
        <Input value={data.slug} onChange={this.handleValueChange.bind(this, 'slug')} />
      </Form.Item>,

      <Form.Item label="Post status">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.status}
          onSelect={this.setValue.bind(this, 'status')}
        >
          <Select.Option value="publish">Publish</Select.Option>
          <Select.Option value="future">Future</Select.Option>
          <Select.Option value="draft">Draft</Select.Option>
          <Select.Option value="pending">Pending Review</Select.Option>
          <Select.Option value="private">Private</Select.Option>
        </Select>
      </Form.Item>,

      <Form.Item label="Post comment status">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.commentStatus}
          onSelect={this.setValue.bind(this, 'commentStatus')}
        >
          <Select.Option value="open">Open</Select.Option>
          <Select.Option value="closed">Closed</Select.Option>
        </Select>
      </Form.Item>,

      <Form.Item label="Category IDs (comma seperated)">
        <Input value={data.categories} onChange={this.handleValueChange.bind(this, 'categories')} />
      </Form.Item>,

      <Form.Item label="Post Format (Advanced use only)">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.format}
          onSelect={this.setValue.bind(this, 'format')}
        >
          <Select.Option value="standard">Standard</Select.Option>
          <Select.Option value="aside">Aside</Select.Option>
          <Select.Option value="chat">Chat</Select.Option>
          <Select.Option value="gallery">Gallery</Select.Option>
          <Select.Option value="link">Link</Select.Option>
          <Select.Option value="image">Image</Select.Option>
          <Select.Option value="quote">Quote</Select.Option>
          <Select.Option value="status">Status</Select.Option>
          <Select.Option value="audio">Audio</Select.Option>
          <Select.Option value="video">Video</Select.Option>
        </Select>
      </Form.Item>,

      <Checkbox
        checked={data.sticky}
        onChange={this.handleCheckedChange.bind(this, 'sticky')}
      >
        Sticky
      </Checkbox>

    );
    return elements;
  }
}

export class WordPressFileSubmissionForm extends GenericFileSubmissionSection<WordPressFileOptions> {
  renderLeftForm(data: WordPressFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
      </div>,
      <Form.Item label="Post slug">
        <Input value={data.slug} onChange={this.handleValueChange.bind(this, 'slug')} />
      </Form.Item>,

      <Form.Item label="Post status">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.status}
          onSelect={this.setValue.bind(this, 'status')}
        >
          <Select.Option value="publish">Publish</Select.Option>
          <Select.Option value="future">Future</Select.Option>
          <Select.Option value="draft">Draft</Select.Option>
          <Select.Option value="pending">Pending Review</Select.Option>
          <Select.Option value="private">Private</Select.Option>
        </Select>
      </Form.Item>,

      <Form.Item label="Post comment status">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.commentStatus}
          onSelect={this.setValue.bind(this, 'commentStatus')}
        >
          <Select.Option value="open">Open</Select.Option>
          <Select.Option value="closed">Closed</Select.Option>
        </Select>
      </Form.Item>,

      <Form.Item label="Categories">
        <Input value={data.categories} onChange={this.handleValueChange.bind(this, 'categories')} />
      </Form.Item>,

      <Form.Item label="Post Format (Advanced use only)">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.format}
          onSelect={this.setValue.bind(this, 'format')}
        >
          <Select.Option value="standard">Standard</Select.Option>
          <Select.Option value="aside">Aside</Select.Option>
          <Select.Option value="chat">Chat</Select.Option>
          <Select.Option value="gallery">Gallery</Select.Option>
          <Select.Option value="link">Link</Select.Option>
          <Select.Option value="image">Image</Select.Option>
          <Select.Option value="quote">Quote</Select.Option>
          <Select.Option value="status">Status</Select.Option>
          <Select.Option value="audio">Audio</Select.Option>
          <Select.Option value="video">Video</Select.Option>
        </Select>
      </Form.Item>,

      <Checkbox
        checked={data.sticky}
        onChange={this.handleCheckedChange.bind(this, 'sticky')}
      >
        Sticky
      </Checkbox>
    );
    return elements;
  }
}
