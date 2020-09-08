import { Checkbox, Form, Select } from 'antd';
import _ from 'lodash';
import React from 'react';
import { FileSubmission } from '../../../../electron-app/src/server/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/server/submission/interfaces/submission.interface';
import { TumblrBlog } from '../../../../electron-app/src/server/websites/tumblr/tumblr-account.interface';
import { TumblrFileOptions, TumblrNotificationOptions } from '../../../../electron-app/src/server/websites/tumblr/tumblr.interface';
import WebsiteService from '../../services/website.service';
import { SubmissionType } from 'postybirb-commons';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps, Website } from '../interfaces/website.interface';
import { TumblrLogin } from './TumblrLogin';

const defaultFileOptions: TumblrFileOptions = {
  ...GenericDefaultFileOptions,
  useTitle: true,
  blog: undefined
};
const defaultNotificationOptions: TumblrNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  useTitle: true,
  blog: undefined
};

export class Tumblr implements Website {
  internalName: string = 'Tumblr';
  name: string = 'Tumblr';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => <TumblrLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, TumblrFileOptions>) => (
    <TumblrFileSubmissionForm key={props.part.accountId} {...props} hideThumbnailOptions={true} />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, TumblrNotificationOptions>
  ) => <TumblrNotificationSubmissionForm key={props.part.accountId} {...props} />;

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(
      type === SubmissionType.FILE ? defaultFileOptions : defaultNotificationOptions
    );
  }
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
