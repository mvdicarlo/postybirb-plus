import React from 'react';
import _ from 'lodash';
import { SubmissionPart } from 'postybirb-commons';
import { SubmissionSectionProps } from '../interfaces/submission-section.interface';
import TagInput from '../form-components/TagInput';
import DescriptionInput from '../form-components/DescriptionInput';
import { Form, Input, Radio } from 'antd';
import { Submission } from 'postybirb-commons';
import { DefaultOptions } from 'postybirb-commons';
import SectionProblems from './SectionProblems';
import { SubmissionRating } from 'postybirb-commons';

export default class DefaultFormSection extends React.Component<
  SubmissionSectionProps<Submission, DefaultOptions>
> {
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

  render() {
    const { data } = this.props.part;
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
        <TagInput
          onChange={this.handleTagChange.bind(this)}
          defaultValue={data.tags}
          label="Tags"
          hideExtend={true}
        />
        <DescriptionInput
          defaultValue={data.description}
          onChange={this.handleDescriptionChange.bind(this)}
          label="Description"
          hideOverwrite={true}
        />
      </div>
    );
  }
}
