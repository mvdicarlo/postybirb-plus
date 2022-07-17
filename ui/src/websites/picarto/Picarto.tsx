import { Checkbox, Form, Select } from 'antd';
import { FileSubmission, Folder, PicartoFileOptions, SubmissionRating } from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { WebsiteImpl } from '../website.base';
import { PicartoCategories } from './picarto-categories';
import { PicartoSoftware } from './picarto-software';

export class Picarto extends WebsiteImpl {
  internalName: string = 'Picarto';
  loginUrl: string = 'https://picarto.tv';
  name: string = 'Picarto';
  supportsTags: boolean = true;
  supportsAdditionalFiles: boolean = true;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, PicartoFileOptions>) => (
    <PicartoFileSubmissionForm
      key={props.part.accountId}
      tagOptions={{
        show: true
      }}
      hideThumbnailOptions={true}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'Everyone'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Ecchi'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'NSFW'
          }
        ]
      }}
      {...props}
    />
  );
}

interface PicartoFileSubmissionState {
  folders: Folder[];
}

export class PicartoFileSubmissionForm extends GenericFileSubmissionSection<PicartoFileOptions> {
  state: PicartoFileSubmissionState = {
    folders: []
  };

  constructor(props: WebsiteSectionProps<FileSubmission, PicartoFileOptions>) {
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

  renderRightForm(data: PicartoFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Folders">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.folder ?? null}
          onChange={this.setValue.bind(this, 'folder')}
        >
          {this.state.folders.map(f => (
            <Select.Option value={f.value}>{f.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
      <Form.Item label="Category">
        <Select
          {...GenericSelectProps}
          value={data.softwares}
          onChange={this.setValue.bind(this, 'category')}
        >
          {PicartoCategories.map(s => (
            <Select.Option value={s}>{s}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
      <Form.Item label="Software">
        <Select
          {...GenericSelectProps}
          mode="multiple"
          value={data.softwares ?? []}
          onChange={this.setValue.bind(this, 'softwares')}
        >
          {PicartoSoftware.map(s => (
            <Select.Option value={s}>{s}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: PicartoFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.downloadSource}
          onChange={this.handleCheckedChange.bind(this, 'downloadSource')}
        >
          Share on feed
        </Checkbox>
      </div>
    );
    return elements;
  }
}
