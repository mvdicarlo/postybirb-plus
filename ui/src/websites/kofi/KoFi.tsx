import { Checkbox, Form, Select } from 'antd';
import _ from 'lodash';
import {
  DefaultOptions,
  FileSubmission,
  Folder,
  KoFiFileOptions,
  Submission
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class KoFi extends WebsiteImpl {
  internalName: string = 'KoFi';
  name: string = 'Ko-fi';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = 'https://ko-fi.com/account/login';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, KoFiFileOptions>) => (
    <KoFiFileSubmissionForm
      {...props}
      ratingOptions={{ show: false }}
      tagOptions={{ show: false }}
      hideThumbnailOptions={true}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: false
      }}
    />
  );
}

interface KoFiFileSubmissionState {
  folders: Folder[];
}

export class KoFiFileSubmissionForm extends GenericFileSubmissionSection<KoFiFileOptions> {
  state: KoFiFileSubmissionState = {
    folders: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, KoFiFileOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data) {
          if (!_.isEqual(this.state.folders, data)) {
            this.setState({ folders: data });
          }
        }
      }
    );
  }

  renderLeftForm(data: KoFiFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.hiRes} onChange={this.handleCheckedChange.bind(this, 'hiRes')}>
          Offer hi-res download (gold only)
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderRightForm(data: KoFiFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Album">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.album}
          onSelect={this.setValue.bind(this, 'album')}
        >
          <Select.Option value="">No album</Select.Option>
          {this.state.folders.map(f => (
            <Select.Option value={f.value}>{f.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
      <Form.Item label="Audience">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.audience}
          onSelect={this.setValue.bind(this, 'audience')}
        >
          <Select.Option value="public">Public</Select.Option>
          <Select.Option value="supporter">All Supporters (gold only)</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }
}
