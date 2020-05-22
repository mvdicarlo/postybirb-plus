import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { DerpibooruOptions } from '../../../../electron-app/src/websites/derpibooru/derpibooru.interface';
import { Form, Input } from 'antd';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';

const defaultOptions: DerpibooruOptions = {
  ...GenericDefaultFileOptions,
  rating: null,
  source: null
};

export class Derpibooru implements Website {
  internalName: string = 'Derpibooru';
  name: string = 'Derpibooru';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://derpibooru.org/session/new" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DerpibooruOptions>) => (
    <DerpibooruFileSubmissionForm key={props.part.accountId} {...props} />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class DerpibooruFileSubmissionForm extends GenericFileSubmissionSection<DerpibooruOptions> {
  constructor(props: WebsiteSectionProps<FileSubmission, DerpibooruOptions>) {
    super(props);
    this.state = {
      folders: []
    };
  }

  renderRightForm(data: DerpibooruOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Source URL">
        <Input value={data.source || ''} onChange={this.handleValueChange.bind(this, 'source')} />
      </Form.Item>
    );
    return elements;
  }
}
