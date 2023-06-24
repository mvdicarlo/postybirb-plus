import { Checkbox, Form, Select } from 'antd';
import _ from 'lodash';
import {
  FileSubmission,
  Folder,
  Submission,
  TelegramFileOptions,
  TelegramNotificationOptions
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import TelegramLogin from './TelegramLogin';

export class Telegram extends WebsiteImpl {
  internalName: string = 'Telegram';
  name: string = 'Telegram';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = false;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <TelegramLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, TelegramFileOptions>) => (
    <TelegramFileSubmissionForm
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: false
      }}
      tagOptions={{ show: false }}
      hideTitle={true}
      hideThumbnailOptions={true}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, TelegramNotificationOptions>
  ) => (
    <TelegramNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
      hideTitle={true}
      ratingOptions={{
        show: false
      }}
      tagOptions={{ show: false }}
    />
  );
}

interface TelegramSubmissionState {
  channels: Folder[];
}

class TelegramNotificationSubmissionForm extends GenericSubmissionSection<
  TelegramNotificationOptions
> {
  state: TelegramSubmissionState = {
    channels: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, TelegramNotificationOptions>) {
    super(props);
    this.state = {
      channels: []
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data) {
          if (!_.isEqual(this.state.channels, data)) {
            this.setState({ channels: data });
          }
        }
      }
    );
  }

  renderLeftForm(data: TelegramNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.silent} onChange={this.handleCheckedChange.bind(this, 'silent')}>
          Silent Notification
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderRightForm(data: TelegramNotificationOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Channels">
        <Select
          {...GenericSelectProps}
          mode="multiple"
          className="w-full"
          value={data.channels}
          onChange={this.setValue.bind(this, 'channels')}
          allowClear={true}
        >
          {this.state.channels.map(folder => {
            if (folder.children && folder.children.length) {
              return (
                <Select.OptGroup label={folder.label}>
                  {folder.children.map(subfolder => (
                    <Select.Option value={subfolder.value}>{subfolder.label}</Select.Option>
                  ))}
                </Select.OptGroup>
              );
            } else {
              return <Select.Option value={folder.value}>{folder.label}</Select.Option>;
            }
          })}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}

export class TelegramFileSubmissionForm extends GenericFileSubmissionSection<TelegramFileOptions> {
  state: TelegramSubmissionState = {
    channels: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, TelegramFileOptions>) {
    super(props);
    this.state = {
      channels: []
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data) {
          if (!_.isEqual(this.state.channels, data)) {
            this.setState({ channels: data });
          }
        }
      }
    );
  }

  renderLeftForm(data: TelegramFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.silent} onChange={this.handleCheckedChange.bind(this, 'silent')}>
          Silent Notification
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.spoiler} onChange={this.handleCheckedChange.bind(this, 'spoiler')}>
          Spoiler
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderRightForm(data: TelegramFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Channels">
        <Select
          {...GenericSelectProps}
          mode="multiple"
          className="w-full"
          value={data.channels}
          onChange={this.setValue.bind(this, 'channels')}
          allowClear={true}
        >
          {this.state.channels.map(folder => {
            if (folder.children && folder.children.length) {
              return (
                <Select.OptGroup label={folder.label}>
                  {folder.children.map(subfolder => (
                    <Select.Option value={subfolder.value}>{subfolder.label}</Select.Option>
                  ))}
                </Select.OptGroup>
              );
            } else {
              return <Select.Option value={folder.value}>{folder.label}</Select.Option>;
            }
          })}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}
