import React from 'react';
import { Form, Input } from 'antd';
import { FileSubmissionSectionProps } from '../interfaces/file-submission-section.interface';
import { DefaultOptions, SubmissionPart } from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';

export default class DefaultFormSection extends React.Component<
  FileSubmissionSectionProps<DefaultOptions>
> {
  handleChange(fieldName: string, e: React.ChangeEvent<HTMLInputElement>) {
    const part: SubmissionPart<DefaultOptions> = JSON.parse(JSON.stringify(this.props.part));
    part.data[fieldName] = e.target.value;
    this.props.onUpdate(part);
  };

  render() {
    const { data } = this.props.part;
    console.log('rendered');
    return (
      <div>
        <Form.Item label="Title">
          <Input defaultValue={data.title} onBlur={this.handleChange.bind(this, 'title')} />
        </Form.Item>
      </div>
    );
  }
}
