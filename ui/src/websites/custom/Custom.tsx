import {
  DefaultFileOptions,
  DefaultOptions,
  FileSubmission,
  Submission
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import CustomAccountInfo from './CustomAccountInfo';

export class Custom extends WebsiteImpl {
  internalName: string = 'Custom';
  name: string = 'Custom';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <CustomAccountInfo {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DefaultFileOptions>) => (
    <GenericFileSubmissionSection key={props.part.accountId} {...props} />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection key={props.part.accountId} {...props} />
  );
}
