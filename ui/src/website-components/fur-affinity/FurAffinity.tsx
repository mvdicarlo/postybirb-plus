import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import {
  FurAffinityFileOptions,
  FurAffinityNotificationOptions
} from '../../../../electron-app/src/websites/fur-affinity/fur-affinity.interface';
import { Folder } from '../../../../electron-app/src/websites/interfaces/folder.interface';
import { Form, Checkbox, Select } from 'antd';
import WebsiteService from '../../services/website.service';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { FurAffinityCategories } from './FurAffinityCategories';
import { FurAffinityThemes } from './FurAffinityThemes';
import { FurAffinitySpecies } from './FurAffinitySpecies';
import { FurAffinityGenders } from './FurAffinityGenders';
import { GenericSelectProps } from '../generic/GenericSelectProps';

const defaultFileOptions: FurAffinityFileOptions = {
  title: undefined,
  useThumbnail: true,
  autoScale: true,
  category: '1',
  disableComments: false,
  folders: [],
  gender: '0',
  reupload: true,
  scraps: false,
  species: '1',
  theme: '1',
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

const defaultNotificationOptions: FurAffinityNotificationOptions = {
  title: undefined,
  rating: null,
  feature: true,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  }
};

export class FurAffinity implements Website {
  internalName: string = 'FurAffinity';
  name: string = 'Fur Affinity';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.furaffinity.net/login" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, FurAffinityFileOptions>) => (
    <FurAffinityFileSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: 'general',
            name: 'General'
          },
          {
            value: 'mature',
            name: 'Mature'
          },
          {
            value: 'adult',
            name: 'Adult'
          }
        ]
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, FurAffinityNotificationOptions>
  ) => (
    <FurAffinityNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
      tagOptions={{ show: false }}
      ratingOptions={{ show: false }}
    />
  );

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(
      type === SubmissionType.FILE ? defaultFileOptions : defaultNotificationOptions
    );
  }
}

interface FurAffinityFileSubmissionState {
  folders: Folder[];
}

class FurAffinityNotificationSubmissionForm extends GenericSubmissionSection<
  FurAffinityNotificationOptions
> {
  renderLeftForm(data: FurAffinityNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.feature} onChange={this.handleCheckedChange.bind(this, 'feature')}>
          Feature
        </Checkbox>
      </div>
    );
    return elements;
  }
}

export class FurAffinityFileSubmissionForm extends GenericFileSubmissionSection<
  FurAffinityFileOptions
> {
  state: FurAffinityFileSubmissionState = {
    folders: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, FurAffinityFileOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    // Not sure if I should move this call elsewhere
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

  renderRightForm(data: FurAffinityFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      ...[
        <Form.Item label="Category">
          <Select
            {...GenericSelectProps}
            style={{ width: '100%' }}
            value={data.category}
            onSelect={this.setValue.bind(this, 'category')}
          >
            {FurAffinityCategories}
          </Select>
        </Form.Item>,
        <Form.Item label="Theme">
          <Select
            {...GenericSelectProps}
            style={{ width: '100%' }}
            value={data.theme}
            onSelect={this.setValue.bind(this, 'theme')}
          >
            {FurAffinityThemes}
          </Select>
        </Form.Item>,
        <Form.Item label="Species">
          <Select
            {...GenericSelectProps}
            style={{ width: '100%' }}
            value={data.species}
            onSelect={this.setValue.bind(this, 'species')}
          >
            {FurAffinitySpecies}
          </Select>
        </Form.Item>,
        <Form.Item label="Gender">
          <Select
            {...GenericSelectProps}
            style={{ width: '100%' }}
            value={data.gender}
            onSelect={this.setValue.bind(this, 'gender')}
          >
            {FurAffinityGenders}
          </Select>
        </Form.Item>,
        <Form.Item label="Folders">
          <Select
            {...GenericSelectProps}
            mode="multiple"
            style={{ width: '100%' }}
            value={data.folders}
            onChange={this.setValue.bind(this, 'folders')}
            allowClear={true}
          >
            {this.state.folders.map(folder => {
              if (folder.subfolders && folder.subfolders.length) {
                return (
                  <Select.OptGroup label={folder.title}>
                    {folder.subfolders.map(subfolder => (
                      <Select.Option value={subfolder.id}>{subfolder.title}</Select.Option>
                    ))}
                  </Select.OptGroup>
                );
              } else {
                return <Select.Option value={folder.id}>{folder.title}</Select.Option>;
              }
            })}
          </Select>
        </Form.Item>
      ]
    );
    return elements;
  }

  renderLeftForm(data: FurAffinityFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      ...[
        <div>
          <Checkbox
            checked={data.disableComments}
            onChange={this.handleCheckedChange.bind(this, 'disableComments')}
          >
            Disable Comments
          </Checkbox>
        </div>,
        <div>
          <Checkbox
            checked={data.reupload}
            onChange={this.handleCheckedChange.bind(this, 'reupload')}
          >
            Reupload better quality image
          </Checkbox>
        </div>,
        <div>
          <Checkbox checked={data.scraps} onChange={this.handleCheckedChange.bind(this, 'scraps')}>
            Send to scraps
          </Checkbox>
        </div>
      ]
    );
    return elements;
  }
}
