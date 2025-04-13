import { Checkbox, Form, Select } from 'antd';
import _ from 'lodash';
import {
  FileSubmission,
  Folder,
  FurAffinityFileOptions,
  FurAffinityNotificationOptions,
  Submission,
  SubmissionRating,
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';
import { FurAffinityCategories } from './FurAffinityCategories';
import { FurAffinityGenders } from './FurAffinityGenders';
import { FurAffinitySpecies } from './FurAffinitySpecies';
import { FurAffinityThemes } from './FurAffinityThemes';

// TODO supports fallback for all real mimetypes
export class FurAffinity extends WebsiteImpl {
  internalName: string = 'FurAffinity';
  name: string = 'Fur Affinity';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = 'https://www.furaffinity.net/login';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, FurAffinityFileOptions>) => (
    <FurAffinityFileSubmissionForm
      key={props.part.accountId}
      tagOptions={{
        show: true,
        options: {
          maxLength: 500,
          mode: 'length',
        },
      }}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'General',
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Mature',
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Adult',
          },
        ],
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, FurAffinityNotificationOptions>,
  ) => (
    <FurAffinityNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
      tagOptions={{ show: false }}
      ratingOptions={{ show: false }}
    />
  );
}

interface FurAffinityFileSubmissionState {
  folders: Folder[];
}

class FurAffinityNotificationSubmissionForm extends GenericSubmissionSection<FurAffinityNotificationOptions> {
  renderLeftForm(data: FurAffinityNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.feature} onChange={this.handleCheckedChange.bind(this, 'feature')}>
          Feature
        </Checkbox>
      </div>,
    );
    return elements;
  }
}

export class FurAffinityFileSubmissionForm extends GenericFileSubmissionSection<FurAffinityFileOptions> {
  state: FurAffinityFileSubmissionState = {
    folders: [],
  };

  constructor(props: SubmissionSectionProps<FileSubmission, FurAffinityFileOptions>) {
    super(props);
    this.state = {
      folders: [],
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data) {
          if (!_.isEqual(this.state.folders, data)) {
            this.setState({ folders: data });
          }
        }
      },
    );
  }

  renderRightForm(data: FurAffinityFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Category">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.category}
          onSelect={this.setValue.bind(this, 'category')}
        >
          {FurAffinityCategories}
        </Select>
      </Form.Item>,
      <Form.Item label="Theme">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.theme}
          onSelect={this.setValue.bind(this, 'theme')}
        >
          {FurAffinityThemes}
        </Select>
      </Form.Item>,
      <Form.Item label="Species">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.species}
          onSelect={this.setValue.bind(this, 'species')}
        >
          {FurAffinitySpecies}
        </Select>
      </Form.Item>,
      <Form.Item label="Gender">
        <Select
          {...GenericSelectProps}
          className="w-full"
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
          className="w-full"
          value={data.folders}
          onChange={this.setValue.bind(this, 'folders')}
          allowClear={true}
        >
          {this.state.folders.map(folder => {
            if (folder.children && folder.children.length) {
              return (
                <Select.OptGroup label={folder.label}>
                  {folder.children.map(subfolder => (
                    <Select.Option value={subfolder.value}>{subfolder.label}</Select.Option>
                  ))}
                </Select.OptGroup>
              );
            } else {
              return <Select.Option value={folder.value}>{folder.label}</Select.Option>;
            }
          })}
        </Select>
      </Form.Item>,
    );
    return elements;
  }

  renderLeftForm(data: FurAffinityFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.disableComments}
          onChange={this.handleCheckedChange.bind(this, 'disableComments')}
        >
          Disable Comments
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.scraps} onChange={this.handleCheckedChange.bind(this, 'scraps')}>
          Send to scraps
        </Checkbox>
      </div>,
    );
    return elements;
  }
}
