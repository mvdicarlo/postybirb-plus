import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import {
  DiscordFileOptions,
  DiscordNotificationOptions
} from '../../../../electron-app/src/websites/discord/discord.interface';
import { Checkbox, Form, Input } from 'antd';
import DiscordLogin from './DiscordLogin';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';
import { SubmissionType } from '../../shared/enums/submission-type.enum';

const defaultOptions: DiscordFileOptions = {
  ...GenericDefaultFileOptions,
  spoiler: false,
  useTitle: true,
  embedColor: 0,
  sources: []
};

const defaultNotificationOptions: DiscordNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  useTitle: true,
  embedColor: 0
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

  renderRightForm(data: DiscordFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <div>
        <Form.Item label="Embed Color Hex">
          <Input
            defaultValue={data.embedColor ? data.embedColor.toString(16).padStart(6, "0") : ''}
            onChange={(e) => {
            if (/^#?[0-9A-F]{6}$/i.test(e.target.value) && parseInt(e.target.value, 16)) {
              this.setValue('embedColor', parseInt(e.target.value, 16));
              // Using html because I don't know antd, and couldn't figure out in their documentation how to dynamically change a label of a form.item, sorry.
              document.getElementById('hexConfirmationText')!.innerHTML = '<b><font color="#00FF00">Valid Hex</font></b>';
            }
            else if (e.target.value === "000000") {
              this.setValue('embedColor', 0);
              document.getElementById('hexConfirmationText')!.innerHTML = '<b><font color="#00FF00">Valid Hex</font></b>';
            }
            else {
              this.setValue('embedColor', '');
              if (e.target.value !== '') {
                document.getElementById('hexConfirmationText')!.innerHTML = '<b><font color="#FF0000">Invalid Hex</font></b>';
              }
              else {
                document.getElementById('hexConfirmationText')!.innerHTML = '<p></p>';
              }
            }
          }} />
        </Form.Item><div id="hexConfirmationText"><p></p></div>
      </div>,
      
    );
    return elements;
  }
}
