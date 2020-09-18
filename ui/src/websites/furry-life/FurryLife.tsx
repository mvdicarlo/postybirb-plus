import { Form, Input, Select } from 'antd';
import _ from 'lodash';
import React from 'react';
import { FileSubmission } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import { DefaultOptions } from 'postybirb-commons';
import { FurryLifeFileOptions } from 'postybirb-commons';
import { Folder } from 'postybirb-commons';
import WebsiteService from '../../services/website.service';
import { SubmissionType } from 'postybirb-commons';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps, Website } from '../interfaces/website.interface';

const defaultFileOptions: FurryLifeFileOptions = {
  ...GenericDefaultFileOptions,
  album: '0-sfw',
  copyright: undefined,
  credit: undefined
};

export class FurryLife implements Website {
  internalName: string = 'FurryLife';
  name: string = 'FurryLife';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://furrylife.online" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, FurryLifeFileOptions>) => (
    <FurryLifeFileSubmissionForm
      key={props.part.accountId}
      {...props}
      hideThumbnailOptions={true}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      ratingOptions={{ show: false }}
      tagOptions={{ show: false }}
      {...props}
    />
  );

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(
      type === SubmissionType.FILE ? defaultFileOptions : GenericDefaultNotificationOptions
    );
  }
}

interface FurryLifeFileSubmissionState {
  folders: Folder[];
}

export class FurryLifeFileSubmissionForm extends GenericFileSubmissionSection<
  FurryLifeFileOptions
> {
  state: FurryLifeFileSubmissionState = {
    folders: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, FurryLifeFileOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data) {
          this.setState({ folders: data });
        }
      }
    );
  }

  renderRightForm(data: FurryLifeFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Album">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.album}
          onSelect={this.setValue.bind(this, 'album')}
        >
          {this.state.folders.map(f => (
            <Select.OptGroup label={f.label}>
              {f.children!.map(c => (
                <Select.Option value={c.value}>{c.label}</Select.Option>
              ))}
            </Select.OptGroup>
          ))}
        </Select>
      </Form.Item>,
      <Form.Item label="Copyright">
        <Input
          value={data.copyright || ''}
          onChange={this.handleValueChange.bind(this, 'copyright')}
        />
      </Form.Item>,
      <Form.Item label="Credit">
        <Input value={data.credit || ''} onChange={this.handleValueChange.bind(this, 'credit')} />
      </Form.Item>
    );
    return elements;
  }
}
