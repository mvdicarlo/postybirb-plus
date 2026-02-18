import { Checkbox, Form, Select } from 'antd';
import _ from 'lodash';
import { FileSubmission, Folder, SoFurryFileOptions, SubmissionRating } from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { WebsiteImpl } from '../website.base';

export class SoFurry extends WebsiteImpl {
  internalName: string = 'SoFurry';
  name: string = 'SoFurry';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = 'https://sofurry.com/login';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, SoFurryFileOptions>) => (
    <SoFurryFileSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: true,
        ratings: [
          { value: SubmissionRating.GENERAL, name: 'Clean' },
          { value: SubmissionRating.MATURE, name: 'Mature' },
          { value: SubmissionRating.ADULT, name: 'Adult' },
        ],
      }}
      tagOptions={{
        show: true,
        options: {
          minTags: 2,
        },
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

export class SoFurryFileSubmissionForm extends GenericFileSubmissionSection<SoFurryFileOptions> {
  state: SoFurrySubmissionState = {
    folders: [],
  };

  constructor(props: SubmissionSectionProps<FileSubmission, SoFurryFileOptions>) {
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
      </Form.Item>,
      <Form.Item label="Category">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.category}
          onSelect={this.setValue.bind(this, 'category')}
        >
          <Select.Option value="10">Artwork</Select.Option>
          <Select.Option value="20">Writing</Select.Option>
          <Select.Option value="30">Photography</Select.Option>
          <Select.Option value="50">Video</Select.Option>
          <Select.Option value="60">3D</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Type">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.type}
          onSelect={this.setValue.bind(this, 'type')}
        >
          <Select.Option value="11">Drawing</Select.Option>
          <Select.Option value="12">Comic</Select.Option>
          <Select.Option value="31">Photograph</Select.Option>
          <Select.Option value="32">Album</Select.Option>
          <Select.Option value="21">Short Story</Select.Option>
          <Select.Option value="22">Book</Select.Option>
          <Select.Option value="13">Animation</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Privacy">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.privacy}
          onSelect={this.setValue.bind(this, 'privacy')}
        >
          <Select.Option value="3">Public</Select.Option>
          <Select.Option value="2">Unlisted</Select.Option>
          <Select.Option value="1">Private</Select.Option>
        </Select>
      </Form.Item>,
    );
    return elements;
  }

  renderLeftForm(data: SoFurryFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.allowComments}
          onChange={this.handleCheckedChange.bind(this, 'allowComments')}
        >
          Allow comments
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.allowDownloads}
          onChange={this.handleCheckedChange.bind(this, 'allowDownloads')}
        >
          Allow downloads
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.intendedAsAdvertisement}
          onChange={this.handleCheckedChange.bind(this, 'intendedAsAdvertisement')}
        >
          Intended as advertisement
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.isWip} onChange={this.handleCheckedChange.bind(this, 'isWip')}>
          Work in progress
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.pixelPerfectDisplay}
          onChange={this.handleCheckedChange.bind(this, 'pixelPerfectDisplay')}
        >
          Pixel perfect display
        </Checkbox>
      </div>,
    );
    return elements;
  }
}
