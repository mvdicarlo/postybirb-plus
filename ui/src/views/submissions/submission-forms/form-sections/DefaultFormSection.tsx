import React from 'react';
import _ from 'lodash';
import { inject } from "mobx-react";
import { SubmissionPart, SubmissionType } from 'postybirb-commons';
import { SubmissionSectionProps } from '../interfaces/submission-section.interface';
import TagInput from '../form-components/TagInput';
import DescriptionInput from '../form-components/DescriptionInput';
import { Form, Icon, Input, Radio, Select } from 'antd';
import { Submission } from 'postybirb-commons';
import { DefaultOptions } from 'postybirb-commons';
import SectionProblems from './SectionProblems';
import { SubmissionRating } from 'postybirb-commons';
import { artconomyTagSearchProvider } from '../../../../websites/artconomy/providers';
import { e621TagSearchProvider } from '../../../../websites/e621/providers';
import { GenericSelectProps } from '../../../../websites/generic/GenericSelectProps';
import { WebsiteRegistry } from '../../../../websites/website-registry';

const SEARCH_PROVIDERS = {
  none: undefined,
  artconomy: artconomyTagSearchProvider,
  e621: e621TagSearchProvider
};

@inject('settingsStore')
export default class DefaultFormSection extends React.Component<
  SubmissionSectionProps<Submission, DefaultOptions>
> {
  static websitesSupportingParentIds: string = (() => {
    const names = WebsiteRegistry.getAllAsArray()
      .filter(website => website.supportsParentId)
      .map(website => website.name);
    if (names.length === 0) {
      return 'nothing';
    } else if (names.length === 1) {
      return names[0];
    } else {
      const last = names.pop();
      return `${names.join(', ')} and ${last}`;
    }
  })();

  handleChange(fieldName: string, { target }) {
    const part: SubmissionPart<DefaultOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.value;
    this.props.onUpdate(part);
  }

  handleTagChange(update: any) {
    const part: SubmissionPart<DefaultOptions> = _.cloneDeep(this.props.part);
    part.data.tags = update;
    this.props.onUpdate(part);
  }

  handleDescriptionChange(update) {
    const part: SubmissionPart<DefaultOptions> = _.cloneDeep(this.props.part);
    part.data.description = update;
    this.props.onUpdate(part);
  }

  handleParentIdChange(parentId: string) {
    const part: SubmissionPart<DefaultOptions> = _.cloneDeep(this.props.part);
    part.data.parentId = parentId;
    this.props.onUpdate(part);
  }

  getParentId(): string {
    const parentId = this.props.part?.data?.parentId || '';
    if (parentId?.length && this.props.parentOptions?.find(({ id }) => id === parentId)) {
      return parentId;
    } else {
      return '';
    }
  }

  getSubmissionTypeIcon(type: SubmissionType): string {
    if (type === SubmissionType.FILE) {
      return 'file';
    } else if (type === SubmissionType.NOTIFICATION) {
      return 'notification';
    } else {
      return 'question';
    }
  }

  render() {
    const { data } = this.props.part;
    const settings = this.props.settingsStore!.settings
    return (
      <div>
        <SectionProblems problems={this.props.problems} />
        <Form.Item label="Title">
          <Input value={data.title} onChange={this.handleChange.bind(this, 'title')} />
        </Form.Item>
        <Form.Item label="Rating" required={true}>
          <Radio.Group
            onChange={this.handleChange.bind(this, 'rating')}
            value={data.rating}
            buttonStyle="solid"
          >
            <Radio.Button value={SubmissionRating.GENERAL}>General</Radio.Button>
            <Radio.Button value={SubmissionRating.MATURE}>Mature</Radio.Button>
            <Radio.Button value={SubmissionRating.ADULT}>Adult</Radio.Button>
            <Radio.Button value={SubmissionRating.EXTREME}>Extreme</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="Content Warning">
          <Input value={data.spoilerText} onChange={this.handleChange.bind(this, 'spoilerText')} />
        </Form.Item>
        <TagInput
          onChange={this.handleTagChange.bind(this)}
          defaultValue={data.tags}
          label="Tags"
          searchProvider={
            SEARCH_PROVIDERS[settings.defaultTagSearchProvider || 'none']
          }
          hideExtend={true}
        />
        <DescriptionInput
          defaultValue={data.description}
          onChange={this.handleDescriptionChange.bind(this)}
          label="Description"
          hideOverwrite={true}
        />
        <Form.Item label="Parent Submission">
          <Select
            {...GenericSelectProps}
            className="w-full"
            value={this.getParentId()}
            onSelect={this.handleParentIdChange.bind(this)}
          >
            <Select.Option value="">None</Select.Option>
            {(this.props.parentOptions || []).map(({ id, type, title }) => (
              <Select.Option value={id}>
                <Icon type={this.getSubmissionTypeIcon(type)}></Icon> {title}
              </Select.Option>
            ))}
          </Select>
          <p>
            Used by <code>parent</code> shortcuts and supported by{' '}
            {DefaultFormSection.websitesSupportingParentIds}.
          </p>
        </Form.Item>
      </div>
    );
  }
}
