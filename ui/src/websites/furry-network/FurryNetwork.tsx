import { Checkbox, Form, Select } from 'antd';
import {
  FileSubmission,
  FileSubmissionType,
  FurryNetworkFileOptions,
  FurryNetworkNotificationOptions,
  Submission,
  SubmissionRating
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import FurryNetworkLoginHelp from './FurryNetworkLoginHelp';

export class FurryNetwork extends WebsiteImpl {
  internalName: string = 'FurryNetwork';
  name: string = 'Furry Network';
  supportsTags: boolean = true;
  loginUrl: string = 'https://furrynetwork.com/';

  LoginHelp = (props: LoginDialogProps) => <FurryNetworkLoginHelp {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, FurryNetworkFileOptions>) => (
    <FurryNetworkFileSubmissionForm
      key={props.part.accountId}
      {...props}
      tagOptions={{
        show: true,
        options: {
          maxTags: 30
        }
      }}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'General'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Mature'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Explicit'
          }
        ]
      }}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, FurryNetworkNotificationOptions>
  ) => (
    <FurryNetworkNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
      tagOptions={{
        show: true,
        options: {
          maxTags: 30
        }
      }}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'General'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Mature'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Explicit'
          }
        ]
      }}
    />
  );
}

interface FurryNetworkSubmissionState {
  collections: Record<string, { id: number; character_id: number; name: string }[]>;
  user: { characters: { id: number; name: string }[] };
}

export class FurryNetworkNotificationSubmissionForm extends GenericSubmissionSection<
  FurryNetworkNotificationOptions
> {
  state: FurryNetworkSubmissionState = {
    collections: {},
    user: { characters: [] }
  };

  constructor(props: WebsiteSectionProps<FileSubmission, FurryNetworkNotificationOptions>) {
    super(props);

    WebsiteService.getAccountInformation(
      this.props.part.website,
      this.props.part.accountId,
      'user'
    ).then(({ data }) => {
      if (data) {
        this.setState({ user: data });
        if (!this.props.part.data.profile) {
          this.setValue('profile', data.characters[0].name);
        }

        this.loadCollections(this.props.part.data.profile!);
      }
    });
  }

  private loadCollections(character: string) {
    WebsiteService.getAccountInformation(
      this.props.part.website,
      this.props.part.accountId,
      `${character}-collections`
    ).then(({ data }) => {
      if (data) {
        this.setState({ collections: data });
      }
    });
  }

  renderRightForm(data: FurryNetworkNotificationOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Profile" required>
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.profile || ''}
          onSelect={value => {
            if (this.props.part.data.profile !== value) {
              this.props.part.data.folders = [];
              this.setValue('profile', value);
              this.loadCollections(value);
            }
          }}
        >
          {this.state.user.characters.map(character => (
            <Select.Option value={character.name}>{character.name}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
      <Form.Item label="Folders">
        <Select
          {...GenericSelectProps}
          className="w-full"
          mode="multiple"
          value={data.folders}
          onChange={this.setValue.bind(this, 'folders')}
          allowClear
        >
          {(this.state.collections.NOTIFICATION || []).map(c => (
            <Select.Option value={c.id}>{c.name}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: FurryNetworkNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.communityTags}
          onChange={this.handleCheckedChange.bind(this, 'communityTags')}
        >
          Allow community tags
        </Checkbox>
      </div>
    );
    return elements;
  }
}

export class FurryNetworkFileSubmissionForm extends GenericFileSubmissionSection<
  FurryNetworkFileOptions
> {
  state: FurryNetworkSubmissionState = {
    collections: {},
    user: { characters: [] }
  };

  constructor(props: WebsiteSectionProps<FileSubmission, FurryNetworkFileOptions>) {
    super(props);

    WebsiteService.getAccountInformation(
      this.props.part.website,
      this.props.part.accountId,
      'user'
    ).then(({ data }) => {
      if (data) {
        this.setState({ user: data });
        if (!this.props.part.data.profile) {
          this.setValue('profile', data.characters[0].name);
        }

        this.loadCollections(this.props.part.data.profile!);
      }
    });
  }

  private loadCollections(character: string) {
    WebsiteService.getAccountInformation(
      this.props.part.website,
      this.props.part.accountId,
      `${character}-collections`
    ).then(({ data }) => {
      if (data) {
        this.setState({ collections: data });
      }
    });
  }

  renderRightForm(data: FurryNetworkFileOptions) {
    const elements = super.renderRightForm(data);
    let type =
      this.props.submission && this.props.submission.primary
        ? this.props.submission.primary.type
        : FileSubmissionType.IMAGE;
    if (this.props.submission && this.props.submission.primary.mimetype === 'image/gif') {
      type = FileSubmissionType.VIDEO;
    }
    elements.push(
      <Form.Item label="Profile" required>
        <Select
          {...GenericSelectProps}
          className="w-full"
          value={data.profile || ''}
          onSelect={value => {
            if (this.props.part.data.profile !== value) {
              this.props.part.data.folders = [];
              this.setValue('profile', value);
              this.loadCollections(value);
            }
          }}
        >
          {this.state.user.characters.map(character => (
            <Select.Option value={character.name}>{character.name}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
      <Form.Item label="Folders">
        <Select
          {...GenericSelectProps}
          className="w-full"
          mode="multiple"
          value={data.folders}
          onChange={this.setValue.bind(this, 'folders')}
          allowClear
        >
          {(this.state.collections[type] || []).map(c => (
            <Select.Option value={c.id}>{c.name}</Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: FurryNetworkFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.communityTags}
          onChange={this.handleCheckedChange.bind(this, 'communityTags')}
        >
          Allow community tags
        </Checkbox>
      </div>
    );
    return elements;
  }
}
