import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { FileSubmission } from 'postybirb-commons';
import { DefaultFileOptions } from 'postybirb-commons';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';

export class Route50 implements Website {
  internalName: string = 'Route50';
  name: string = 'Route 50';
  supportsTags = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="http://route50.net/login" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DefaultFileOptions>) => (
    <GenericFileSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{ show: false }}
    />
  );

  supportsTextType(type: string): boolean {
    return ['text/plain'].includes(type);
  }

  getDefaults() {
    return _.cloneDeep(GenericDefaultFileOptions);
  }
}
