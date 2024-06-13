import { Form, Select, Checkbox, Input } from 'antd';
import {
  FileSubmission,
  SubmissionRating,
  ItakuFileOptions,
  Folder,
  ItakuNotificationOptions,
  Submission
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class Itaku extends WebsiteImpl {
  internalName: string = 'Itaku';
  loginUrl: string = 'https://itaku.ee';
  name: string = 'Itaku';
  supportsTags: boolean = true;
  supportsAdditionalFiles: boolean = true;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, ItakuFileOptions>) => (
    <ItakuFileSubmissionForm
      key={props.part.accountId}
      tagOptions={{
        show: true,
        options: {
          minTags: 5
        }
      }}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'General'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Questionable'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'NSFW'
          }
        ]
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, ItakuNotificationOptions>
  ) => (
    <ItakuNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
      tagOptions={{
        show: true
      }}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'General'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Questionable'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'NSFW'
          }
        ]
      }}
    />
  );
}

interface ItakuFileSubmissionState {
  folders: Folder[];
}

export class ItakuNotificationSubmissionForm extends GenericSubmissionSection<
  ItakuNotificationOptions
> {
  state: ItakuFileSubmissionState = {
    folders: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, ItakuNotificationOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    WebsiteService.getAccountInformation(
      this.props.part.website,
      this.props.part.accountId,
      'POST-folders'
    ).then(({ data }) => {
      if (data) {
        this.setState({ folders: data });
      }
    });
  }

  renderRightForm(data: ItakuNotificationOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Folders">
        <Select
          {...GenericSelectProps}
          mode="multiple"
          className="w-full"
          value={data.folders}
          onChange={this.setValue.bind(this, 'folders')}
          allowClear={true}
        >
          {this.state.folders.map(f => (
            <Select.Option value={f.value}>{f.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
      <Form.Item label="Visibility">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.visibility}
          onChange={this.setValue.bind(this, 'visibility')}
        >
          <Select.Option value={'PUBLIC'}>Public Post</Select.Option>
          <Select.Option value={'PROFILE_ONLY'}>Profile Only</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: ItakuNotificationOptions) {
    const elements = super.renderLeftForm(data);
    return elements;
  }
}

export class ItakuFileSubmissionForm extends GenericFileSubmissionSection<ItakuFileOptions> {
  state: ItakuFileSubmissionState = {
    folders: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, ItakuFileOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    WebsiteService.getAccountInformation(
      this.props.part.website,
      this.props.part.accountId,
      'GALLERY-folders'
    ).then(({ data }) => {
      if (data) {
        this.setState({ folders: data });
      }
    });
  }

  renderRightForm(data: ItakuFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Folders">
        <Select
          {...GenericSelectProps}
          mode="multiple"
          className="w-full"
          value={data.folders}
          onChange={this.setValue.bind(this, 'folders')}
          allowClear={true}
        >
          {this.state.folders.map(f => (
            <Select.Option value={f.value}>{f.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
      <Form.Item label="Visibility">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.visibility}
          onChange={this.setValue.bind(this, 'visibility')}
        >
          <Select.Option value={'PUBLIC'}>Public Gallery</Select.Option>
          <Select.Option value={'PROFILE_ONLY'}>Profile Only</Select.Option>
          <Select.Option value={'UNLISTED'}>Unlisted</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: ItakuFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.shareOnFeed}
          onChange={this.handleCheckedChange.bind(this, 'shareOnFeed')}
        >
          Share on feed
        </Checkbox>
      </div>,
      <Form.Item label="Content Warning">
        <Input
          value={data.spoilerText}
          onChange={this.handleValueChange.bind(this, 'spoilerText')}
          maxLength={30}
        />
      </Form.Item>
    );
    return elements;
  }
}
