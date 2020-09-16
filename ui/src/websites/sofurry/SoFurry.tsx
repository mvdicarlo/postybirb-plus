import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { SoFurryFileOptions } from 'postybirb-commons';
import { Folder } from 'postybirb-commons';
import { Form, Checkbox, Select } from 'antd';
import WebsiteService from '../../services/website.service';
import { FileSubmission } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { SubmissionRating } from 'postybirb-commons';

// TODO make a separate notification options
const defaultOptions: SoFurryFileOptions = {
  title: undefined,
  useThumbnail: true,
  autoScale: true,
  folder: '0',
  viewOptions: '0',
  thumbnailAsCoverArt: false,
  rating: null,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  }
};

export class SoFurry implements Website {
  internalName: string = 'SoFurry';
  name: string = 'SoFurry';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.sofurry.com/user/login" {...props} />
  );

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

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, SoFurryFileOptions>) => (
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

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }

  supportsTextType(type: string): boolean {
    return ['text/plain'].includes(type);
  }
}

interface SoFurrySubmissionState {
  folders: Folder[];
}

export class SoFurryNotificationSubmissionForm extends GenericSubmissionSection<
  SoFurryFileOptions
> {
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
