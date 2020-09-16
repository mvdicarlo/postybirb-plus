import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { e621Options } from 'postybirb-commons';
import { SubmissionPart } from 'postybirb-commons';
import { Form, Input } from 'antd';
import { FileSubmission } from 'postybirb-commons';
import E621Login from './e621Login';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';

const defaultOptions: e621Options = {
  ...GenericDefaultFileOptions,
  sources: [],
  parentId: undefined
};

export class e621 implements Website {
  internalName: string = 'e621';
  name: string = 'e621';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => <E621Login {...props} />;

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, e621Options>) => (
    <E621FileSubmissionForm hideThumbnailOptions={true} key={props.part.accountId} {...props} />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class E621FileSubmissionForm extends GenericFileSubmissionSection<e621Options> {
  handleSourceChange(index: number, { target }) {
    const part: SubmissionPart<e621Options> = _.cloneDeep(this.props.part);
    part.data.sources[index] = target.value;
    this.props.onUpdate(part);
  }

  getSourceSection() {
    const sources: JSX.Element[] = [];
    const { data } = this.props.part;
    for (let i = 0; i < 5; i++) {
      sources.push(
        <Form.Item label={`Source ${i + 1}`}>
          <Input value={data.sources[i]} onChange={this.handleSourceChange.bind(this, i)} />
        </Form.Item>
      );
    }
    return sources;
  }

  renderRightForm(data: e621Options) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Parent Id">
        <Input onChange={this.handleValueChange.bind(this, 'parentId')} />
      </Form.Item>
    );
    elements.push(...this.getSourceSection());
    return elements;
  }
}
