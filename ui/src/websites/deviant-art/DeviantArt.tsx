import { Checkbox, Form, Select } from 'antd';
import _ from 'lodash';
import {
  DefaultOptions,
  DeviantArtFileOptions,
  FileSubmission,
  Folder,
  Submission
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import { DeviantArtLogin } from './DeviantArtLogin';

export class DeviantArt extends WebsiteImpl {
         internalName: string = 'DeviantArt';
         name: string = 'Deviant Art';
         supportsAdditionalFiles: boolean = false;
         supportsTags: boolean = true;
         loginUrl: string = '';

         LoginDialog = (props: LoginDialogProps) => <DeviantArtLogin {...props} />;

         FileSubmissionForm = (
           props: WebsiteSectionProps<FileSubmission, DeviantArtFileOptions>
         ) => (
           <DeviantArtFileSubmissionForm
             key={props.part.accountId}
             tagOptions={{ show: true, options: { maxLength: 30, mode: 'count' } }}
             hideThumbnailOptions={true}
             {...props}
           />
         );

         NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
           <GenericSubmissionSection
             key={props.part.accountId}
             tagOptions={{ show: false }}
             ratingOptions={{ show: false }}
             {...props}
           />
         );
       }

interface DeviantArtFileSubmissionState {
  folders: Folder[];
}

export class DeviantArtFileSubmissionForm extends GenericFileSubmissionSection<
  DeviantArtFileOptions
> {
  state: DeviantArtFileSubmissionState = {
    folders: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, DeviantArtFileOptions>) {
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

  renderRightForm(data: DeviantArtFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Folders">
        <Select
          disabled={data.scraps}
          {...GenericSelectProps}
          mode="multiple"
          className="w-full"
          value={data.folders}
          onChange={this.setValue.bind(this, 'folders')}
          allowClear={true}
        >
          {this.state.folders.map(folder => (
            <Select.Option value={folder.value}>{folder.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
      <Form.Item label="Mature Category">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.matureClassification}
          onChange={this.setValue.bind(this, 'matureClassification')}
          mode="multiple"
        >
          <Select.Option value="nudity">Nudity</Select.Option>
          <Select.Option value="sexual">Sexual Themes</Select.Option>
          <Select.Option value="gore">Gore/Violence</Select.Option>
          <Select.Option value="language">Strong Language</Select.Option>
          <Select.Option value="ideology">Ideology</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Mature Content">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.matureLevel}
          onSelect={this.setValue.bind(this, 'matureLevel')}
        >
          <Select.Option value="">None</Select.Option>
          <Select.Option value="moderate">Moderate</Select.Option>
          <Select.Option value="strict">Strict</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Display Resolution">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.displayResolution}
          onSelect={this.setValue.bind(this, 'displayResolution')}
        >
          <Select.Option value="0">Original</Select.Option>
          <Select.Option value="1">400px</Select.Option>
          <Select.Option value="2">600px</Select.Option>
          <Select.Option value="3">800px</Select.Option>
          <Select.Option value="4">900px</Select.Option>
          <Select.Option value="5">1024px</Select.Option>
          <Select.Option value="6">1280px</Select.Option>
          <Select.Option value="7">1600px</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: DeviantArtFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.feature} onChange={this.handleCheckedChange.bind(this, 'feature')}>
          Feature
        </Checkbox>
      </div>,
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
          checked={data.critique}
          onChange={this.handleCheckedChange.bind(this, 'critique')}
        >
          Critique
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.freeDownload}
          onChange={this.handleCheckedChange.bind(this, 'freeDownload')}
        >
          Allow free download
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.scraps} onChange={this.handleCheckedChange.bind(this, 'scraps')}>
          Send to scraps
        </Checkbox>
      </div>
    );
    return elements;
  }
}
