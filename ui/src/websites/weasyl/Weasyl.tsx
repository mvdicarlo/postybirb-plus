import { Checkbox, Form, Select } from 'antd';
import {
  DefaultOptions,
  FileSubmission,
  Folder,
  Submission,
  SubmissionRating,
  WeasylFileOptions
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';
import { WeasylCategories } from './WeasylCategories';

export class Weasyl extends WebsiteImpl {
  internalName: string = 'Weasyl';
  name: string = 'Weasyl';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = 'https://www.weasyl.com/signin';

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
