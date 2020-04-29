import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import {
  SubscribeStarFileOptions,
  SubscribeStarNotificationOptions
} from '../../../../electron-app/src/websites/subscribe-star/subscribe-star.interface';
import { Form, Select } from 'antd';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';

const defaultFileOptions: SubscribeStarFileOptions = {
  ...GenericDefaultFileOptions,
  tier: 'free'
};

const defaultNotificationOptions: SubscribeStarNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  tier: 'free'
};

export class SubscribeStar implements Website {
  internalName: string = 'SubscribeStar';
  name: string = 'SubscribeStar';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.subscribestar.com" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, SubscribeStarFileOptions>) => (
    <SubscribeStarFileSubmissionForm
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

export class SubscribeStarNotificationSubmissionForm extends GenericSubmissionSection<
  SubscribeStarNotificationOptions
> {
  renderLeftForm(data: SubscribeStarNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <Form.Item label="Access Tier">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.tier}
          onSelect={this.setValue.bind(this, 'tier')}
        >
          <Select.Option value="free">Free</Select.Option>
          <Select.Option value="basic">Subscribers Only</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }
}

export class SubscribeStarFileSubmissionForm extends GenericFileSubmissionSection<
  SubscribeStarFileOptions
> {
  renderRightForm(data: SubscribeStarFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Access Tier">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.tier}
          onSelect={this.setValue.bind(this, 'tier')}
        >
          <Select.Option value="free">Free</Select.Option>
          <Select.Option value="basic">Subscribers Only</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }
}
