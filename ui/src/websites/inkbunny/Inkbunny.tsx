import { Checkbox, Form, Select } from 'antd';
import { FileSubmission, InkbunnyFileOptions } from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import InkbunnyLogin from './InkbunnyLogin';

export class Inkbunny extends WebsiteImpl {
  internalName: string = 'Inkbunny';
  name: string = 'Inkbunny';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <InkbunnyLogin {...props} />;
  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, InkbunnyFileOptions>) => (
    <InkbunnyFileSubmissionForm
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: '2',
            name: 'Nudity'
          },
          {
            value: '3',
            name: 'Violence'
          },
          {
            value: '2,3',
            name: 'Nudity + Violence',
          },
          {
            value: '4',
            name: 'Sexual'
          },
          {
            value: '5',
            name: 'Brutal'
          },
          {
            value: '2,5',
            name: 'Nudity + Brutal',
          },
          {
            value: '3,4',
            name: 'Sexual + Violent',
          },
          {
            value: '4,5',
            name: 'Sexual + Brutal',
          },
        ]
      }}
      key={props.part.accountId}
      {...props}
    />
  );
}

export class InkbunnyFileSubmissionForm extends GenericFileSubmissionSection<InkbunnyFileOptions> {
  renderRightForm(data: InkbunnyFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Category">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.submissionType}
          onSelect={this.setValue.bind(this, 'submissionType')}
        >
          <Select.Option value="1">Picture/Pinup</Select.Option>
          <Select.Option value="2">Sketch</Select.Option>
          <Select.Option value="3">Picture Series</Select.Option>
          <Select.Option value="4">Comic</Select.Option>
          <Select.Option value="5">Portfolio</Select.Option>
          <Select.Option value="6">Shoockwave/Flash - Animation</Select.Option>
          <Select.Option value="7">Shockwave/Flash - Interactive</Select.Option>
          <Select.Option value="8">Video - Feature Length</Select.Option>
          <Select.Option value="9">Video - Animation/3D/CGI</Select.Option>
          <Select.Option value="10">Music - Single Track</Select.Option>
          <Select.Option value="11">Music - Album</Select.Option>
          <Select.Option value="12">Writing - Document</Select.Option>
          <Select.Option value="13">Character Sheet</Select.Option>
          <Select.Option value="14">Photography - Fursuit/Sculpture/Jewelry/etc</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: InkbunnyFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.blockGuests}
          onChange={this.handleCheckedChange.bind(this, 'blockGuests')}
        >
          Block Guests
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.friendsOnly}
          onChange={this.handleCheckedChange.bind(this, 'friendsOnly')}
        >
          Friends Only
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.notify} onChange={this.handleCheckedChange.bind(this, 'notify')}>
          Notify Watchers
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
