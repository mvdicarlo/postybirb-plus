import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { WeasylFileOptions } from 'postybirb-commons';
import { Folder } from 'postybirb-commons';
import { Form, Checkbox, Select } from 'antd';
import WebsiteService from '../../services/website.service';
import { FileSubmission } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { DefaultOptions } from 'postybirb-commons';
import { WeasylCategories } from './WeasylCategories';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { SubmissionRating } from 'postybirb-commons';

const defaultOptions: WeasylFileOptions = {
  ...GenericDefaultFileOptions,
  notify: true,
  critique: false,
  folder: null,
  category: null
};

export class Weasyl implements Website {
  internalName: string = 'Weasyl';
  name: string = 'Weasyl';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.weasyl.com/signin" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, WeasylFileOptions>) => (
    <WeasylFileSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'General'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Mature (18+ non-sexual)'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Explicit (18+ sexual)'
          }
        ]
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'General'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Mature (18+ non-sexual)'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Explicit (18+ sexual)'
          }
        ]
      }}
    />
  );

  // TODO make a real notification file option
  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }

  supportsTextType(type: string): boolean {
    return ['text/md', 'text/plain', 'text/pdf', 'application/pdf'].includes(type);
  }
}

interface WeasylFileSubmissionState {
  folders: Folder[];
}

export class WeasylFileSubmissionForm extends GenericFileSubmissionSection<WeasylFileOptions> {
  state: WeasylFileSubmissionState = {
    folders: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, WeasylFileOptions>) {
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

  renderRightForm(data: WeasylFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Category">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.category}
          onSelect={this.setValue.bind(this, 'category')}
        >
          {this.props.submission && WeasylCategories[this.props.submission.primary.type]
            ? (WeasylCategories[this.props.submission.primary.type] || []).map(item => (
                <Select.Option value={item.id}>{item.name}</Select.Option>
              ))
            : Object.entries(WeasylCategories).map(([key, values]) => (
                <Select.OptGroup label={key}>
                  {values.map(item => (
                    <Select.Option value={item.id}>{item.name}</Select.Option>
                  ))}
                </Select.OptGroup>
              ))}
        </Select>
      </Form.Item>,
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

  renderLeftForm(data: WeasylFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.notify} onChange={this.handleCheckedChange.bind(this, 'notify')}>
          Notify
        </Checkbox>
      </div>
    );
    elements.push(
      <div>
        <Checkbox
          checked={data.critique}
          onChange={this.handleCheckedChange.bind(this, 'critique')}
        >
          Flag this submission for critique
        </Checkbox>
      </div>
    );
    return elements;
  }
}
