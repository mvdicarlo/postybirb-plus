import { Checkbox, DatePicker, Form, Input, Select } from 'antd';
import _ from 'lodash';
import moment from 'moment';
import {
  FileSubmission,
  Folder,
  PatreonFileOptions,
  PatreonNotificationOptions,
  Submission
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class Patreon extends WebsiteImpl {
  internalName: string = 'Patreon';
  name: string = 'Patreon';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = 'https://www.patreon.com/login';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, PatreonFileOptions>) => (
    <PatreonFileSubmissionForm
      key={props.part.accountId}
      hideTitle={true}
      ratingOptions={{
        show: false
      }}
      tagOptions={{
        show: true,
        options: {
          maxTags: 50
        }
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, PatreonNotificationOptions>
  ) => (
    <PatreonNotificationSubmissionForm
      key={props.part.accountId}
      hideTitle={true}
      ratingOptions={{
        show: false
      }}
      tagOptions={{
        show: true,
        options: {
          maxTags: 50
        }
      }}
      {...props}
    />
  );
}

interface PatreonSubmissionState {
  folders: Folder[];
}

export class PatreonNotificationSubmissionForm extends GenericSubmissionSection<
  PatreonNotificationOptions
> {
  state: PatreonSubmissionState = {
    folders: []
  };

  patronsOnlyId: string = '';
  publicId: string = '';

  constructor(props: WebsiteSectionProps<FileSubmission, PatreonNotificationOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data) {
          if (!_.isEqual(this.state.folders, data)) {
            data.forEach(tier => {
              if (tier.label === 'Patrons Only') {
                this.patronsOnlyId = tier.value!;
              }

              if (tier.label === 'Public') {
                this.publicId = tier.value!;
              }
            });
            this.setState({ folders: data });
          }
        }
      }
    );
  }

  renderLeftForm(data: PatreonNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.charge} onChange={this.handleCheckedChange.bind(this, 'charge')}>
          Charge patrons{' '}
          <small>
            (Patrons will be charged their pledge amount for this post on the first of next month.)
          </small>
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderRightForm(data: PatreonFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Access Tiers">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.tiers}
          mode="multiple"
          onChange={(value: string[] | undefined) => {
            if (value) {
              let val = [...value];
              if (val.includes(this.patronsOnlyId)) {
                val = [this.patronsOnlyId];
              } else if (val.includes(this.publicId)) {
                val = [this.publicId];
              }
              this.setValue('tiers', val);
            } else {
              this.setState('tiers', value);
            }
          }}
          allowClear
        >
          {this.state.folders.map(f =>
            f.children && f.children.length ? (
              <Select.OptGroup label={f.label}>
                {f.children.map(c => (
                  <Select.Option value={c.value}>{c.label}</Select.Option>
                ))}
              </Select.OptGroup>
            ) : (
              <Select.Option value={f.value}>{f.label}</Select.Option>
            )
          )}
        </Select>
      </Form.Item>,
      <Form.Item label="Schedule">
        <DatePicker
          defaultValue={data.schedule ? moment(data.schedule) : undefined}
          format="YYYY-MM-DD HH:mm:ss"
          showTime={{ format: 'HH:mm:ss', use12Hours: true }}
          placeholder="Unscheduled"
          onChange={value =>
            this.setValue('schedule', value ? value.toDate().toString() : undefined)
          }
        />
      </Form.Item>,
      <Form.Item label="Teaser Text" help={`${(data.teaser || '').length} / 140`}>
        <Input.TextArea
          value={data.teaser}
          rows={3}
          onChange={this.handleValueChange.bind(this, 'teaser')}
          maxLength={140}
        />
      </Form.Item>
    );
    return elements;
  }
}

export class PatreonFileSubmissionForm extends GenericFileSubmissionSection<PatreonFileOptions> {
  state: PatreonSubmissionState = {
    folders: []
  };

  patronsOnlyId: string = '';
  publicId: string = '';

  constructor(props: WebsiteSectionProps<FileSubmission, PatreonFileOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data) {
          if (!_.isEqual(this.state.folders, data)) {
            data.forEach(tier => {
              if (tier.label === 'Patrons Only') {
                this.patronsOnlyId = tier.value!;
              }

              if (tier.label === 'Public') {
                this.publicId = tier.value!;
              }
            });
            this.setState({ folders: data });
          }
        }
      }
    );
  }

  renderLeftForm(data: PatreonFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.charge} onChange={this.handleCheckedChange.bind(this, 'charge')}>
          Charge patrons{' '}
          <small>
            (Patrons will be charged their pledge amount for this post on the first of next month.)
          </small>
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.allAsAttachment}
          onChange={this.handleCheckedChange.bind(this, 'allAsAttachment')}
        >
          Additional images as attachments{' '}
          <small>(Additional images will be posted as file attachments.)</small>
        </Checkbox>
      </div>
    );
    return elements;
  }

  renderRightForm(data: PatreonFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Access Tiers">
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.tiers}
          mode="multiple"
          onChange={(value: string[] | undefined) => {
            if (value) {
              let val = [...value];
              if (val.includes(this.patronsOnlyId)) {
                val = [this.patronsOnlyId];
              } else if (val.includes(this.publicId)) {
                val = [this.publicId];
              }
              this.setValue('tiers', val);
            } else {
              this.setState('tiers', value);
            }
          }}
          allowClear
        >
          {this.state.folders.map(f =>
            f.children && f.children.length ? (
              <Select.OptGroup label={f.label}>
                {f.children.map(c => (
                  <Select.Option value={c.value}>{c.label}</Select.Option>
                ))}
              </Select.OptGroup>
            ) : (
              <Select.Option value={f.value}>{f.label}</Select.Option>
            )
          )}
        </Select>
      </Form.Item>,
      <Form.Item label="Schedule">
        <DatePicker
          defaultValue={data.schedule ? moment(data.schedule) : undefined}
          format="YYYY-MM-DD HH:mm:ss"
          showTime={{ format: 'HH:mm:ss', use12Hours: true }}
          placeholder="Unscheduled"
          onChange={value =>
            this.setValue('schedule', value ? value.toDate().toString() : undefined)
          }
        />
      </Form.Item>,
      <Form.Item
        label="Teaser Text"
        help={`${(data.teaser || '').length} / 140`}
      >
        <Input.TextArea
          value={data.teaser}
          rows={3}
          onChange={this.handleValueChange.bind(this, 'teaser')}
          maxLength={140}
        />
      </Form.Item>
    );
    return elements;
  }
}
