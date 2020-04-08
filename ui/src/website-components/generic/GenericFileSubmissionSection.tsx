import React from 'react';
import * as _ from 'lodash';
import { SubmissionPart } from '../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import TagInput from '../../views/submissions/submission-forms/form-components/TagInput';
import DescriptionInput from '../../views/submissions/submission-forms/form-components/DescriptionInput';
import { Alert, Form, Input, Checkbox } from 'antd';
import {
  DefaultOptions,
  DefaultFileOptions
} from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';

const defaultOptions: DefaultFileOptions = {
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  },
  rating: null,
  useThumbnail: true,
  autoScale: true
};

export default class GenericFileSubmissionSection extends React.Component<
  SubmissionSectionProps<FileSubmission, DefaultFileOptions>
> {
  handleChange(fieldName: string, { target }) {
    const part: SubmissionPart<DefaultFileOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.value;
    this.props.onUpdate(part);
  }

  handleTagChange(update: any) {
    const part: SubmissionPart<DefaultFileOptions> = _.cloneDeep(this.props.part);
    part.data.tags = update;
    this.props.onUpdate(part);
  }

  handleDescriptionChange(update) {
    const part: SubmissionPart<DefaultFileOptions> = _.cloneDeep(this.props.part);
    part.data.description = update;
    this.props.onUpdate(part);
  }

  handleCheckboxChange(fieldName: string, { target }) {
    const part: SubmissionPart<DefaultFileOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.checked;
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
          <Form.Item>
            <div>
              <div>
                <Checkbox
                  checked={data.autoScale}
                  onChange={this.handleCheckboxChange.bind(this, 'autoScale')}
                >
                  Downscale images to fit size limit
                </Checkbox>
              </div>
              <div>
                <Checkbox
                  checked={data.useThumbnail}
                  onChange={this.handleCheckboxChange.bind(this, 'useThumbnail')}
                >
                  Use thumbnail (if provided)
                </Checkbox>
              </div>
            </div>
          </Form.Item>
        </div>
      </div>
    );
  }
}
