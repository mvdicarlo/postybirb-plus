import { Checkbox, Form, Select } from 'antd';
import _ from 'lodash';
import React from 'react';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import {
  PillowfortFileOptions,
  PillowfortNotificationOptions
} from '../../../../electron-app/src/websites/pillowfort/pillowfort.interface';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps, Website } from '../interfaces/website.interface';

const defaultFileOptions: PillowfortFileOptions = {
  ...GenericDefaultFileOptions,
  privacy: 'public',
  allowComments: true,
  allowReblogging: true
};

const defaultNotificationOptions: PillowfortNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  privacy: 'public',
  allowComments: true,
  allowReblogging: true
};

const privacyOptions = {
  public: 'Everyone',
  followers: 'Followers',
  mutuals: 'Mutuals',
  private: 'Private'
};

export class Pillowfort implements Website {
  internalName: string = 'Pillowfort';
  name: string = 'Pillowfort';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.pillowfort.social/users/sign_in" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, PillowfortFileOptions>) => (
    <PillowfortFileSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: true,
        ratings: [
          {
            name: 'SFW',
            value: 'general'
          },
          {
            name: 'NSFW',
            value: 'adult'
          }
        ]
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, PillowfortNotificationOptions>
  ) => (
    <PillowfortNotificationSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: true,
        ratings: [
          {
            name: 'SFW',
            value: 'general'
          },
          {
            name: 'NSFW',
            value: 'adult'
          }
        ]
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

export class PillowfortNotificationSubmissionForm extends GenericSubmissionSection<
  PillowfortNotificationOptions
> {
  renderLeftForm(data: PillowfortNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.allowComments}
          onChange={this.handleCheckedChange.bind(this, 'allowComments')}
        >
          Allow comments
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.allowReblogging}
          onChange={this.handleCheckedChange.bind(this, 'allowReblogging')}
        >
          Allow reblogging
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderRightForm(data: PillowfortFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Can be viewed by">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.privacy}
          onChange={this.setValue.bind(this, 'privacy')}
        >
          {Object.entries(privacyOptions).map(([value, title]) => (
            <Select.Option value={value}>{title}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}

export class PillowfortFileSubmissionForm extends GenericFileSubmissionSection<
  PillowfortFileOptions
> {
  renderLeftForm(data: PillowfortFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.allowComments}
          onChange={this.handleCheckedChange.bind(this, 'allowComments')}
        >
          Allow comments
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.allowReblogging}
          onChange={this.handleCheckedChange.bind(this, 'allowReblogging')}
        >
          Allow reblogging
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderRightForm(data: PillowfortFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Can be viewed by">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.privacy}
          onChange={this.setValue.bind(this, 'privacy')}
        >
          {Object.entries(privacyOptions).map(([value, title]) => (
            <Select.Option value={value}>{title}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}
