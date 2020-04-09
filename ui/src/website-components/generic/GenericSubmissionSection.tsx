import React from 'react';
import * as _ from 'lodash';
import { SubmissionPart } from '../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import TagInput from '../../views/submissions/submission-forms/form-components/TagInput';
import DescriptionInput from '../../views/submissions/submission-forms/form-components/DescriptionInput';
import { Form, Input, Radio } from 'antd';
import { DefaultOptions } from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import SectionProblems from '../../views/submissions/submission-forms/form-sections/SectionProblems';

const defaultOptions: DefaultOptions = {
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  },
  rating: null
};

export default class GenericSubmissionSection extends React.Component<
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

  handleCheckboxChange(fieldName: string, { target }) {
    const part: SubmissionPart<DefaultOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.checked;
    this.props.onUpdate(part);
  }

  render() {
    const { data } = this.props.part;
    const showRating = _.get(this.props.ratingOptions, 'show', false);
    return (
      <div>
        <SectionProblems problems={this.props.problems} />
        <div>
          <Form.Item label="Title">
            <Input
              placeholder="Using default"
              value={data.title}
              onChange={this.handleChange.bind(this, 'title')}
            />
          </Form.Item>
          <TagInput
            onChange={this.handleTagChange.bind(this)}
            defaultValue={data.tags}
            defaultTags={this.props.defaultData!.tags}
            label="Tags"
          />
          <DescriptionInput
            defaultValue={data.description}
            onChange={this.handleDescriptionChange.bind(this)}
            label="Description"
            overwriteDescriptionValue={_.get(this.props.defaultData, 'description.value')}
          />
          {showRating ? (
            <Form.Item label="Rating">
              {this.props.ratingOptions!.ratings ? (
                <Radio.Group
                  onChange={this.handleChange.bind(this, 'rating')}
                  value={data.rating}
                  buttonStyle="solid"
                >
                  <Radio.Button value={null}>Default</Radio.Button>
                  {this.props.ratingOptions!.ratings.map(v => (
                    <Radio.Button value={v.value}>{v.name}</Radio.Button>
                  ))}
                </Radio.Group>
              ) : (
                <Radio.Group
                  onChange={this.handleChange.bind(this, 'rating')}
                  value={data.rating}
                  buttonStyle="solid"
                >
                  <Radio.Button value={null}>Default</Radio.Button>
                  <Radio.Button value="general">General</Radio.Button>
                  <Radio.Button value="mature">Mature</Radio.Button>
                  <Radio.Button value="adult">Adult</Radio.Button>
                  <Radio.Button value="extreme">Extreme</Radio.Button>
                </Radio.Group>
              )}
            </Form.Item>
          ) : null}
        </div>
      </div>
    );
  }
}
