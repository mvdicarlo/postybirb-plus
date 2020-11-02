import { Form, Select } from 'antd';
import {
  FileSubmission,
  NewTumblBlog,
  NewTumblFileOptions,
  NewTumblNotificationOptions,
  Submission,
  SubmissionRating
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class NewTumbl extends WebsiteImpl {
  internalName: string = 'NewTumbl';
  name: string = 'newTumbl';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = 'https://newtumbl.com/';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, NewTumblFileOptions>) => (
    <NewTumblFileSubmissionForm
      key={props.part.accountId}
      hideThumbnailOptions={true}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'F'
          },
          {
            value: '2',
            name: 'O'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'M'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'X'
          },
          {
            value: SubmissionRating.EXTREME,
            name: 'W'
          }
        ]
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, NewTumblNotificationOptions>
  ) => (
    <NewTumblNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'F'
          },
          {
            value: '2',
            name: 'O'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'M'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'X'
          },
          {
            value: SubmissionRating.EXTREME,
            name: 'W'
          }
        ]
      }}
    />
  );
}

interface NewTumblSubmissionState {
  blogs: NewTumblBlog[];
}

export class NewTumblNotificationSubmissionForm extends GenericSubmissionSection<
  NewTumblNotificationOptions
> {
  state: NewTumblSubmissionState = {
    blogs: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, NewTumblNotificationOptions>) {
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
      }
    });
  }

  renderRightForm(data: NewTumblNotificationOptions) {
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
            <Select.Option value={b.id}>{b.name}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}

export class NewTumblFileSubmissionForm extends GenericFileSubmissionSection<NewTumblFileOptions> {
  state: NewTumblSubmissionState = {
    blogs: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, NewTumblFileOptions>) {
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
          this.setValue('blog', data.find(b => b.primary).id);
        }
      }
    });
  }

  renderRightForm(data: NewTumblFileOptions) {
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
            <Select.Option value={b.id}>{b.name}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}
