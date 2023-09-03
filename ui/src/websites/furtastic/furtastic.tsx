import { Form, Input } from 'antd';
import _ from 'lodash';
import { furtasticFileOptions, FileSubmission, SubmissionPart } from 'postybirb-commons';
import React from 'react';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import FurtasticLogin from './furtasticLogin';
import { e621TagSearchProvider } from '../e621/providers';

export class Furtastic extends WebsiteImpl {
  internalName: string = 'furtastic';
  name: string = 'furtastic';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <FurtasticLogin {...props} />;

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, furtasticFileOptions>) => (
    <FurtasticFileSubmissionForm
      hideThumbnailOptions={true}
      tagOptions={{
        show: true,
        searchProvider: e621TagSearchProvider
      }}
      key={props.part.accountId}
      {...props}
    />
  );
}

export class FurtasticFileSubmissionForm extends GenericFileSubmissionSection<furtasticFileOptions> {
  handleSourceChange(index: number, { target }) {
    const part: SubmissionPart<furtasticFileOptions> = _.cloneDeep(this.props.part);
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

  renderRightForm(data: furtasticFileOptions) {
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
