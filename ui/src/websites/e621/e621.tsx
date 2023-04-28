import { Form, Input } from 'antd';
import _ from 'lodash';
import { e621FileOptions, FileSubmission, SubmissionPart } from 'postybirb-commons';
import React from 'react';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import E621Login from './e621Login';
import { e621TagSearchProvider } from './providers';

export class e621 extends WebsiteImpl {
  internalName: string = 'e621';
  name: string = 'e621';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <E621Login {...props} />;

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, e621FileOptions>) => (
    <E621FileSubmissionForm
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

export class E621FileSubmissionForm extends GenericFileSubmissionSection<e621FileOptions> {
  handleSourceChange(index: number, { target }) {
    const part: SubmissionPart<e621FileOptions> = _.cloneDeep(this.props.part);
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

  renderRightForm(data: e621FileOptions) {
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
