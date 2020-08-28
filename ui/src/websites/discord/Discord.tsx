import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import {
  DiscordFileOptions,
  DiscordNotificationOptions
} from '../../../../electron-app/src/server/websites/discord/discord.interface';
import { Checkbox } from 'antd';
import DiscordLogin from './DiscordLogin';
import { FileSubmission } from '../../../../electron-app/src/server/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/server/submission/interfaces/submission.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';
import { SubmissionType } from '../../shared/enums/submission-type.enum';

const defaultOptions: DiscordFileOptions = {
  ...GenericDefaultFileOptions,
  spoiler: false,
  useTitle: true
};

const defaultNotificationOptions: DiscordNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  useTitle: true
};

export class Discord implements Website {
  internalName: string = 'Discord';
  name: string = 'Discord';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = false;
  LoginDialog = (props: LoginDialogProps) => <DiscordLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DiscordFileOptions>) => (
    <DiscordFileSubmissionForm
      hideThumbnailOptions={true}
      tagOptions={{ show: false }}
      ratingOptions={{ show: false }}
      key={props.part.accountId}
      {...props}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DiscordFileOptions>) => (
    <DiscordNotificationSubmissionForm
      tagOptions={{ show: false }}
      ratingOptions={{ show: false }}
      key={props.part.accountId}
      {...props}
    />
  );

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(type === SubmissionType.FILE ? defaultOptions : defaultNotificationOptions);
  }
}

export class DiscordNotificationSubmissionForm extends GenericSubmissionSection<
  DiscordFileOptions
> {
  renderLeftForm(data: DiscordFileOptions) {
    const elements = super.renderLeftForm(data);
    return [
      ...elements,
      <div>
        <Checkbox
          checked={data.useTitle}
          onChange={this.handleCheckedChange.bind(this, 'useTitle')}
        >
          Use Title
        </Checkbox>
      </div>
    ];
  }
}

export class DiscordFileSubmissionForm extends GenericFileSubmissionSection<DiscordFileOptions> {
  renderLeftForm(data: DiscordFileOptions) {
    const elements = super.renderLeftForm(data);
    return [
      ...elements,
      <div>
        <Checkbox
          checked={data.useTitle}
          onChange={this.handleCheckedChange.bind(this, 'useTitle')}
        >
          Use Title
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.spoiler} onChange={this.handleCheckedChange.bind(this, 'spoiler')}>
          Spoiler
        </Checkbox>
      </div>
    ];
  }
}
