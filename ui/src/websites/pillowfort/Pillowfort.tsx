import { Checkbox, Form, Select } from 'antd';
import {
  FileSubmission,
  PillowfortFileOptions,
  PillowfortNotificationOptions,
  Submission,
  SubmissionRating,
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';

const privacyOptions = {
  public: 'Everyone',
  followers: 'Followers',
  mutuals: 'Mutuals',
  private: 'Private',
};

export class Pillowfort extends WebsiteImpl {
  internalName: string = 'Pillowfort';
  name: string = 'Pillowfort';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = 'https://www.pillowfort.social/users/sign_in';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, PillowfortFileOptions>) => (
    <PillowfortFileSubmissionForm
      key={props.part.accountId}
      hideThumbnailOptions={true}
      ratingOptions={{
        show: true,
        ratings: [
          {
            name: 'SFW',
            value: SubmissionRating.GENERAL,
          },
          {
            name: 'NSFW',
            value: SubmissionRating.ADULT,
          },
        ],
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, PillowfortNotificationOptions>,
  ) => (
    <PillowfortNotificationSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: true,
        ratings: [
          {
            name: 'SFW',
            value: SubmissionRating.GENERAL,
          },
          {
            name: 'NSFW',
            value: SubmissionRating.ADULT,
          },
        ],
      }}
      {...props}
    />
  );
}

export class PillowfortNotificationSubmissionForm extends GenericSubmissionSection<PillowfortNotificationOptions> {
  renderLeftForm(data: PillowfortNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.allowComments}
          onChange={this.handleCheckedChange.bind(this, 'allowComments')}
        >
          Allow comments
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.allowReblogging}
          onChange={this.handleCheckedChange.bind(this, 'allowReblogging')}
        >
          Allow reblogging
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.useTitle}
          onChange={this.handleCheckedChange.bind(this, 'useTitle')}
        >
          Use title
        </Checkbox>
      </div>,
    );
    return elements;
  }

  renderRightForm(data: PillowfortFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Can be viewed by">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.privacy}
          onChange={this.setValue.bind(this, 'privacy')}
        >
          {Object.entries(privacyOptions).map(([value, title]) => (
            <Select.Option value={value}>{title}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
    );
    return elements;
  }
}

export class PillowfortFileSubmissionForm extends GenericFileSubmissionSection<PillowfortFileOptions> {
  renderLeftForm(data: PillowfortFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.allowComments}
          onChange={this.handleCheckedChange.bind(this, 'allowComments')}
        >
          Allow comments
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.allowReblogging}
          onChange={this.handleCheckedChange.bind(this, 'allowReblogging')}
        >
          Allow reblogging
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.useTitle}
          onChange={this.handleCheckedChange.bind(this, 'useTitle')}
        >
          Use title
        </Checkbox>
      </div>,
    );
    return elements;
  }

  renderRightForm(data: PillowfortFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Can be viewed by">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.privacy}
          onChange={this.setValue.bind(this, 'privacy')}
        >
          {Object.entries(privacyOptions).map(([value, title]) => (
            <Select.Option value={value}>{title}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
    );
    return elements;
  }
}
