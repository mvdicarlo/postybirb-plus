import { Form, Select } from 'antd';
import _ from 'lodash';
import { FileSubmission, Folder, PiczelFileOptions, SubmissionRating } from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { WebsiteImpl } from '../website.base';

export class Piczel extends WebsiteImpl {
  internalName: string = 'Piczel';
  name: string = 'Piczel';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = 'https://piczel.tv/login';

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
