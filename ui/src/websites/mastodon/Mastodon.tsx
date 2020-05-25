import { Checkbox, Form, Input } from 'antd';
import _ from 'lodash';
import React from 'react';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import {
  MastodonFileOptions,
  MastodonNotificationOptions
} from '../../../../electron-app/src/websites/mastodon/mastodon.interface';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps, Website } from '../interfaces/website.interface';
import MastodonLogin from './MastodonLogin';

const defaultFileOptions: MastodonFileOptions = {
  ...GenericDefaultFileOptions,
  useTitle: false,
  spoilerText: ''
};
const defaultNotificationOptions: MastodonNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  useTitle: false,
  spoilerText: ''
};

export class Mastodon implements Website {
  internalName: string = 'Mastodon';
  name: string = 'Mastodon Instance';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = false;
  LoginDialog = (props: LoginDialogProps) => <MastodonLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, MastodonFileOptions>) => (
    <MastodonFileSubmissionForm
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          { name: 'Safe', value: 'general' },
          { name: 'Sensitive', value: 'adult' }
        ]
      }}
      tagOptions={{ show: false }}
      hideThumbnailOptions={true}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, MastodonNotificationOptions>
  ) => (
    <MastodonNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          { name: 'Safe', value: 'general' },
          { name: 'Sensitive', value: 'adult' }
        ]
      }}
      tagOptions={{ show: false }}
    />
  );

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(
      type === SubmissionType.FILE ? defaultFileOptions : defaultNotificationOptions
    );
  }
}

class MastodonNotificationSubmissionForm extends GenericSubmissionSection<
  MastodonNotificationOptions
> {
  renderLeftForm(data: MastodonNotificationOptions) {
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
      </Form.Item>
    );
    return elements;
  }
}

export class MastodonFileSubmissionForm extends GenericFileSubmissionSection<MastodonFileOptions> {
  renderLeftForm(data: MastodonFileOptions) {
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
      </Form.Item>
    );
    return elements;
  }
}
