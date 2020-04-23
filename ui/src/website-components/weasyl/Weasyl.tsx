import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { WeasylOptions } from '../../../../electron-app/src/websites/weasyl/weasyl.interface';
import { Folder } from '../../../../electron-app/src/websites/interfaces/folder.interface';
import { Form, Checkbox, Select } from 'antd';
import WebsiteService from '../../services/website.service';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { DefaultOptions } from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import { WeasylCategories } from './WeasylCategories';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';

const defaultOptions: WeasylOptions = {
  title: undefined,
  useThumbnail: true,
  autoScale: true,
  notify: true,
  critique: false,
  folder: null,
  category: null,
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

export class Weasyl implements Website {
  internalName: string = 'Weasyl';
  name: string = 'Weasyl';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.weasyl.com/signin" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, WeasylOptions>) => (
    <WeasylFileSubmissionForm
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
            name: 'Mature (18+ non-sexual)'
          },
          {
            value: 'adult',
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
            value: 'general',
            name: 'General'
          },
          {
            value: 'mature',
            name: 'Mature (18+ non-sexual)'
          },
          {
            value: 'adult',
            name: 'Explicit (18+ sexual)'
          }
        ]
      }}
    />
  );

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

export class WeasylFileSubmissionForm extends GenericFileSubmissionSection<WeasylOptions> {
  state: WeasylFileSubmissionState = {
    folders: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, WeasylOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    // Not sure if I should move this call elsewhere
    WebsiteService.getAccountInformation(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data.folders) {
          if (!_.isEqual(this.state.folders, data.folders)) {
            this.setState({ folders: data.folders });
          }
        }
      }
    );
  }

  renderRightForm(data: WeasylOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      ...[
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
      ]
    );
    return elements;
  }

  renderLeftForm(data: WeasylOptions) {
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
