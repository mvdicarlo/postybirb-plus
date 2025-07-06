import { Checkbox, Form, Select} from 'antd';
import { DiscordFileOptions, FileSubmission, Submission } from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import DiscordLogin from './DiscordLogin';

export class Discord extends WebsiteImpl {
  internalName: string = 'Discord';
  name: string = 'Discord';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = false;
  loginUrl: string = '';

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
	  
	  return [
        ...elements,
		<Form.Item label="File Size Limit">
		<Select
		  {...GenericSelectProps}
		  onChange={this.setValue.bind(this, 'filesizelimit')}
		  className="w-full"
		  value={data.filesizelimit}
		>
		  <Select.Option value={10}>10 MB (Default)</Select.Option>
		  <Select.Option value={50}>50 MB (Nitro Classic / Boost Level 2)</Select.Option>
		  <Select.Option value={100}>100 MB (Boost Level 3)</Select.Option>
		  <Select.Option value={500}>500 MB (Nitro)</Select.Option>
		</Select>
		</Form.Item>
      ];
    }
}
