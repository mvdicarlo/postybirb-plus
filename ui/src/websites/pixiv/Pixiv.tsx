import { Checkbox, Form, Radio, Select } from 'antd';
import _ from 'lodash';
import React from 'react';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { PixivFileOptions } from '../../../../electron-app/src/websites/pixiv/pixiv.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { LoginDialogProps, Website } from '../interfaces/website.interface';

const defaultOptions: PixivFileOptions = {
  communityTags: true,
  matureContent: [],
  original: false,
  sexual: undefined,
  containsContent: [],
  title: undefined,
  useThumbnail: true,
  autoScale: true,
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

export class Pixiv implements Website {
  internalName: string = 'Pixiv';
  name: string = 'Pixiv';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://accounts.pixiv.net/login?lang=en" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, PixivFileOptions>) => (
    <PixivFileSubmissionForm
      key={props.part.accountId}
      tagOptions={{ show: true, options: { maxTags: 10 } }}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: 'general',
            name: 'All ages'
          },
          {
            value: 'mature',
            name: 'R-18'
          },
          {
            value: 'extreme',
            name: 'R-18G'
          }
        ]
      }}
      {...props}
    />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class PixivFileSubmissionForm extends GenericFileSubmissionSection<PixivFileOptions> {
  renderRightForm(data: PixivFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Contains Content">
        <Select
          className="w-full"
          {...GenericSelectProps}
          value={data.containsContent}
          onChange={this.setValue.bind(this, 'containsContent')}
          mode="multiple"
          allowClear
        >
          <Select.Option value="violent">Violence</Select.Option>
          <Select.Option value="drug">References to drugs, alcohol, and smoking</Select.Option>
          <Select.Option value="thoughts">Strong language/Sensitive themes</Select.Option>
          <Select.Option value="antisocial">Depictions of criminal activity</Select.Option>
          <Select.Option value="religion">Religious imagery</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: PixivFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.original}
          onChange={this.handleCheckedChange.bind(this, 'original')}
        >
          Original work
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.communityTags}
          onChange={this.handleCheckedChange.bind(this, 'communityTags')}
        >
          Allow other users to edit tags
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderWideForm(data: PixivFileOptions) {
    const elements = super.renderWideForm(data);
    const rating = data.rating || this.props.defaultData!.rating;
    if (data.rating === 'general') {
      elements.push(
        <div>
          <Checkbox checked={data.sexual} onChange={this.handleCheckedChange.bind(this, 'sexual')}>
            Includes slightly sexual or suggestive content
          </Checkbox>
        </div>
      );
    } else {
      elements.push(
        <Form.Item label="Mature Content">
          <Select
            className="w-full"
            {...GenericSelectProps}
            value={data.matureContent}
            onChange={this.setValue.bind(this, 'matureContent')}
            mode="multiple"
            allowClear
          >
            <Select.Option value="lo">Minors</Select.Option>
            <Select.Option value="furry">Furry</Select.Option>
            <Select.Option value="bl">BL</Select.Option>
            <Select.Option value="yuri">GL</Select.Option>
          </Select>
        </Form.Item>
      );
    }
    return elements;
  }
}
