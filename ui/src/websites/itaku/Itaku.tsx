import { Form, Select, Checkbox } from 'antd';
import { FileSubmission, SubmissionRating, ItakuFileOptions, Folder } from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { WebsiteImpl } from '../website.base';

export class Itaku extends WebsiteImpl {
  internalName: string = 'Itaku';
  loginUrl: string = 'https://itaku.ee';
  name: string = 'Itaku';
  supportsTags: boolean = true;
  supportsAdditionalFiles: boolean = true;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, any>) => (
    <ItakuFileSubmissionForm
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
            name: 'Questionable'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'NSFW'
          },
          {
            value: SubmissionRating.EXTREME,
            name: 'NSFL'
          }
        ]
      }}
      {...props}
    />
  );
}

interface ItakuFileSubmissionState {
  folders: Folder[];
}

export class ItakuFileSubmissionForm extends GenericFileSubmissionSection<ItakuFileOptions> {
  state: ItakuFileSubmissionState = {
    folders: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, ItakuFileOptions>) {
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

  renderRightForm(data: ItakuFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Folder">
        <Select
          {...GenericSelectProps}
          mode="multiple"
          className="w-full"
          value={data.folders}
          onSelect={this.setValue.bind(this, 'folders')}
          allowClear={true}
        >
          <Select.Option value={undefined}>None</Select.Option>
          {this.state.folders.map(f => (
            <Select.Option value={f.value}>{f.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: ItakuFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.shareOnFeed}
          onChange={this.handleCheckedChange.bind(this, 'shareOnFeed')}
        >
          Share on feed
        </Checkbox>
      </div>
    );
    return elements;
  }
}
