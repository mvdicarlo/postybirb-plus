import { Checkbox, Form, Select } from 'antd';
import _ from 'lodash';
import {
  FileSubmission,
  Folder,
  SoFurryFileOptions,
  SoFurryNotificationOptions,
  Submission,
  SubmissionRating
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class SoFurry extends WebsiteImpl {
  internalName: string = 'SoFurry';
  name: string = 'SoFurry';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = 'https://www.sofurry.com/user/login';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, SoFurryFileOptions>) => (
    <SoFurryFileSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: true,
        ratings: [
          { value: SubmissionRating.GENERAL, name: 'All Ages' },
          { value: SubmissionRating.ADULT, name: 'Adult' },
          { value: SubmissionRating.EXTREME, name: 'Extreme' }
        ]
      }}
      tagOptions={{
        show: true,
        options: {
          minTags: 2
        }
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, SoFurryNotificationOptions>
  ) => (
    <SoFurryNotificationSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: true,
        ratings: [
          { value: SubmissionRating.GENERAL, name: 'All Ages' },
          { value: SubmissionRating.ADULT, name: 'Adult' },
          { value: SubmissionRating.EXTREME, name: 'Extreme' }
        ]
      }}
      {...props}
    />
  );

  supportsTextType(type: string): boolean {
    return ['text/plain'].includes(type);
  }
}

interface SoFurrySubmissionState {
  folders: Folder[];
}

export class SoFurryNotificationSubmissionForm extends GenericSubmissionSection<
  SoFurryNotificationOptions
> {
  state: SoFurrySubmissionState = {
    folders: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, SoFurryNotificationOptions>) {
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

  renderRightForm(data: SoFurryNotificationOptions) {
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

export class SoFurryFileSubmissionForm extends GenericFileSubmissionSection<SoFurryFileOptions> {
  state: SoFurrySubmissionState = {
    folders: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, SoFurryFileOptions>) {
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

  renderRightForm(data: SoFurryFileOptions) {
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

  renderLeftForm(data: SoFurryFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.thumbnailAsCoverArt}
          onChange={this.handleCheckedChange.bind(this, 'thumbnailAsCoverArt')}
        >
          Use thumbnail as cover art
        </Checkbox>
      </div>
    );
    return elements;
  }
}
