import { Checkbox, Form, Select } from 'antd';
import { FileSubmission, PixivFileOptions, SubmissionRating } from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { WebsiteImpl } from '../website.base';

export class Pixiv extends WebsiteImpl {
  internalName: string = 'Pixiv';
  name: string = 'Pixiv';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = 'https://accounts.pixiv.net/login?lang=en';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, PixivFileOptions>) => (
    <PixivFileSubmissionForm
      key={props.part.accountId}
      tagOptions={{ show: true, options: { maxTags: 10 } }}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'All ages'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'R-18'
          },
          {
            value: SubmissionRating.EXTREME,
            name: 'R-18G'
          }
        ]
      }}
      {...props}
    />
  );
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
      </div>,
      <div>
        <Checkbox
          checked={data.aiGenerated}
          onChange={this.handleCheckedChange.bind(this, 'aiGenerated')}
        >
          AI-generated work
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderWideForm(data: PixivFileOptions) {
    const elements = super.renderWideForm(data);
    const rating = data.rating || this.props.defaultData!.rating;
    if (rating === 'general') {
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
