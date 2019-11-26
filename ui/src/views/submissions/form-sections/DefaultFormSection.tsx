import React from 'react';
import _ from 'lodash';
import {
  DefaultOptions,
  SubmissionPart
} from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';
import { FileSubmissionSectionProps } from '../interfaces/file-submission-section.interface';
import TagInput from '../form-components/TagInput';
import DescriptionInput from '../form-components/DescriptionInput';
import { Form, Input, Radio, Alert } from 'antd';

export default class DefaultFormSection extends React.Component<
  FileSubmissionSectionProps<DefaultOptions>
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
        {this.props.problems.length ? (
          <Alert
            type="error"
            message={
              <ul>
                {this.props.problems.map(problem => (
                  <li>{problem}</li>
                ))}
              </ul>
            }
          />
        ) : null}
        <Form.Item label="Title">
          <Input defaultValue={data.title} onBlur={this.handleChange.bind(this, 'title')} />
        </Form.Item>
        <Form.Item label="Rating" required={true}>
          <Radio.Group
            onChange={this.handleChange.bind(this, 'rating')}
            defaultValue={data.rating}
            buttonStyle="solid"
          >
            <Radio.Button value="general">General</Radio.Button>
            <Radio.Button value="mature">Mature</Radio.Button>
            <Radio.Button value="adult">Adult</Radio.Button>
            <Radio.Button value="extreme">Extreme</Radio.Button>
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
