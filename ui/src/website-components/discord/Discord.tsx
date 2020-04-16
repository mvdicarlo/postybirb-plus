import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { DiscordOptions } from '../../../../electron-app/src/websites/discord/discord.interface';
import { Checkbox } from 'antd';
import DiscordLogin from './DiscordLogin';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';

const defaultOptions: DiscordOptions = {
  spoiler: false,
  useTitle: true,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  },
  rating: null,
  useThumbnail: true,
  autoScale: true
};

export class Discord implements Website {
  internalName: string = 'Discord';
  name: string = 'Discord';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = false;
  LoginDialog = (props: LoginDialogProps) => <DiscordLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DiscordOptions>) => (
    <DiscordFileSubmissionForm
      hideThumbnailOptions={true}
      tagOptions={{ show: false }}
      ratingOptions={{ show: false }}
      key={props.part.accountId}
      {...props}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DiscordOptions>) => (
    <DiscordNotificationSubmissionForm
      tagOptions={{ show: false }}
      ratingOptions={{ show: false }}
      key={props.part.accountId}
      {...props}
    />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class DiscordNotificationSubmissionForm extends GenericSubmissionSection<DiscordOptions> {
  renderLeftForm(data: DiscordOptions) {
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

export class DiscordFileSubmissionForm extends GenericFileSubmissionSection<DiscordOptions> {
  renderLeftForm(data: DiscordOptions) {
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
