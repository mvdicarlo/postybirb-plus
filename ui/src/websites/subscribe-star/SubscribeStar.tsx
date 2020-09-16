import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import {
  SubscribeStarFileOptions,
  SubscribeStarNotificationOptions
} from 'postybirb-commons';
import { Form, Select, Checkbox } from 'antd';
import { FileSubmission } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { SubmissionType } from 'postybirb-commons';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { Folder } from 'postybirb-commons';
import WebsiteService from '../../services/website.service';

const defaultFileOptions: SubscribeStarFileOptions = {
  ...GenericDefaultFileOptions,
  tier: 'free',
  useTitle: true
};

const defaultNotificationOptions: SubscribeStarNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  tier: 'free',
  useTitle: true
};

export class SubscribeStar implements Website {
  internalName: string = 'SubscribeStar';
  name: string = 'SubscribeStar';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = false;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.subscribestar.com" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, SubscribeStarFileOptions>) => (
    <SubscribeStarFileSubmissionForm
      key={props.part.accountId}
      hideThumbnailOptions={true}
      hideTitle={true}
      ratingOptions={{
        show: false
      }}
      tagOptions={{
        show: false
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, SubscribeStarNotificationOptions>
  ) => (
    <SubscribeStarNotificationSubmissionForm
      key={props.part.accountId}
      hideTitle={true}
      ratingOptions={{
        show: false
      }}
      tagOptions={{
        show: false
      }}
      {...props}
    />
  );

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(
      type === SubmissionType.FILE ? defaultFileOptions : defaultNotificationOptions
    );
  }
}

interface SubscribeStarSubmissionState {
  tiers: Folder[];
}

export class SubscribeStarNotificationSubmissionForm extends GenericSubmissionSection<
  SubscribeStarNotificationOptions
> {
  state: SubscribeStarSubmissionState = {
    tiers: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, SubscribeStarNotificationOptions>) {
    super(props);
    this.state = {
      tiers: []
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data) {
          this.setState({ tiers: data });
        }
      }
    );
  }

  renderLeftForm(data: SubscribeStarNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.useTitle}
          onChange={this.handleCheckedChange.bind(this, 'useTitle')}
        >
          Use Title
        </Checkbox>
      </div>,
      <Form.Item label="Access Tier">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.tier}
          onSelect={this.setValue.bind(this, 'tier')}
        >
          {this.state.tiers.map(tier => (
            <Select.Option value={tier.value}>{tier.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}

export class SubscribeStarFileSubmissionForm extends GenericFileSubmissionSection<
  SubscribeStarFileOptions
> {
  state: SubscribeStarSubmissionState = {
    tiers: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, SubscribeStarFileOptions>) {
    super(props);
    this.state = {
      tiers: []
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data) {
          this.setState({ tiers: data });
        }
      }
    );
  }

  renderLeftForm(data: SubscribeStarFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.useTitle}
          onChange={this.handleCheckedChange.bind(this, 'useTitle')}
        >
          Use Title
        </Checkbox>
      </div>,
      <Form.Item label="Access Tier">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.tier}
          onSelect={this.setValue.bind(this, 'tier')}
        >
          {this.state.tiers.map(tier => (
            <Select.Option value={tier.value}>{tier.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}
