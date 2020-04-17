import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { Form, Checkbox, Select } from 'antd';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { InkbunnyOptions } from '../../../../electron-app/src/websites/inkbunny/inkbunny.interface';
import InkbunnyLogin from './InkbunnyLogin';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';

const defaultOptions: InkbunnyOptions = {
  blockGuests: false,
  friendsOnly: false,
  notify: true,
  scraps: false,
  submissionType: undefined,
  rating: null,
  useThumbnail: true,
  autoScale: true,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  }
};

export class Inkbunny implements Website {
  internalName: string = 'Inkbunny';
  name: string = 'Inkbunny';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => <InkbunnyLogin {...props} />;
  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, InkbunnyOptions>) => (
    <InkbunnyFileSubmissionForm
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: '2',
            name: 'Nudity - Nonsexual'
          },
          {
            value: '3',
            name: 'Violence - Mild'
          },
          {
            value: '4',
            name: 'Sexual Themes - Erotic'
          },
          {
            value: '5',
            name: 'Strong Violence'
          }
        ]
      }}
      key={props.part.accountId}
      {...props}
    />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class InkbunnyFileSubmissionForm extends GenericFileSubmissionSection<InkbunnyOptions> {
  renderRightForm(data: InkbunnyOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Category">
        <Select
          {...GenericSelectProps}
          style={{ width: '100%' }}
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

  renderLeftForm(data: InkbunnyOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      ...[
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
      ]
    );
    return elements;
  }
}
