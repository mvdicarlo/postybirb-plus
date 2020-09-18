import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { PiczelFileOptions } from 'postybirb-commons';
import { Folder } from 'postybirb-commons';
import { Form, Select } from 'antd';
import WebsiteService from '../../services/website.service';
import { FileSubmission } from 'postybirb-commons';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { SubmissionRating } from 'postybirb-commons';

const defaultOptions: PiczelFileOptions = {
  ...GenericDefaultFileOptions,
  folder: null
};

export class Piczel implements Website {
  internalName: string = 'Piczel';
  name: string = 'Piczel';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://piczel.tv/login" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, PiczelFileOptions>) => (
    <PiczelFileSubmissionForm
      ratingOptions={{
        show: true,
        ratings: [
          { value: SubmissionRating.GENERAL, name: 'SFW' },
          { value: SubmissionRating.ADULT, name: 'NSFW' }
        ]
      }}
      key={props.part.accountId}
      {...props}
    />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

interface PiczelFileSubmissionState {
  folders: Folder[];
}

export class PiczelFileSubmissionForm extends GenericFileSubmissionSection<PiczelFileOptions> {
  state: PiczelFileSubmissionState = {
    folders: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, PiczelFileOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data && data.length) {
          if (!_.isEqual(this.state.folders, data)) {
            this.setState({ folders: data });
          }
        }
      }
    );
  }

  renderRightForm(data: PiczelFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Folder">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.folder}
          onSelect={this.setValue.bind(this, 'folder')}
        >
          {this.state.folders.map(f => (
            <Select.Option value={f.value}>{f.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }
}
