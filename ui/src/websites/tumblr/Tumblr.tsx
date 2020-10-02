import { Checkbox, Form, Select } from 'antd';
import {
  FileSubmission,
  Submission,
  TumblrBlog,
  TumblrFileOptions,
  TumblrNotificationOptions
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import { TumblrLogin } from './TumblrLogin';

export class Tumblr extends WebsiteImpl {
  internalName: string = 'Tumblr';
  name: string = 'Tumblr';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <TumblrLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, TumblrFileOptions>) => (
    <TumblrFileSubmissionForm key={props.part.accountId} {...props} hideThumbnailOptions={true} />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, TumblrNotificationOptions>
  ) => <TumblrNotificationSubmissionForm key={props.part.accountId} {...props} />;
}

interface TumblrSubmissionState {
  blogs: TumblrBlog[];
}

export class TumblrNotificationSubmissionForm extends GenericSubmissionSection<
  TumblrNotificationOptions
> {
  state: TumblrSubmissionState = {
    blogs: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, TumblrNotificationOptions>) {
    super(props);
    this.state = {
      blogs: []
    };

    WebsiteService.getAccountInformation(
      this.props.part.website,
      this.props.part.accountId,
      'blogs'
    ).then(({ data }) => {
      if (data) {
        this.setState({ blogs: data });
        if (!this.props.part.data.blog) {
          this.setValue('blog', data.find(b => b.primary).name);
        }
      }
    });
  }

  renderLeftForm(data: TumblrNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.useTitle}
          onChange={this.handleCheckedChange.bind(this, 'useTitle')}
        >
          Use Title
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderRightForm(data: TumblrNotificationOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Blog">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.blog}
          onSelect={this.setValue.bind(this, 'blog')}
        >
          {this.state.blogs.map(b => (
            <Select.Option value={b.name}>{b.name}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}

export class TumblrFileSubmissionForm extends GenericFileSubmissionSection<TumblrFileOptions> {
  state: TumblrSubmissionState = {
    blogs: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, TumblrFileOptions>) {
    super(props);
    this.state = {
      blogs: []
    };

    WebsiteService.getAccountInformation(
      this.props.part.website,
      this.props.part.accountId,
      'blogs'
    ).then(({ data }) => {
      if (data) {
        this.setState({ blogs: data });
        if (!this.props.part.data.blog) {
          this.setValue('blog', data.find(b => b.primary).name);
        }
      }
    });
  }

  renderLeftForm(data: TumblrFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.useTitle}
          onChange={this.handleCheckedChange.bind(this, 'useTitle')}
        >
          Use Title
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderRightForm(data: TumblrFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Blog">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.blog}
          onSelect={this.setValue.bind(this, 'blog')}
        >
          {this.state.blogs.map(b => (
            <Select.Option value={b.name}>{b.name}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}
