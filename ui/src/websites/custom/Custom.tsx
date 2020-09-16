import _ from 'lodash';
import React from 'react';
import { FileSubmission } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import {
  DefaultFileOptions,
  DefaultOptions
} from 'postybirb-commons';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps, Website } from '../interfaces/website.interface';
import CustomAccountInfo from './CustomAccountInfo';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { SubmissionType } from 'postybirb-commons';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';

export class Custom implements Website {
  internalName: string = 'Custom';
  name: string = 'Custom';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => <CustomAccountInfo {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DefaultFileOptions>) => (
    <GenericFileSubmissionSection key={props.part.accountId} {...props} />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection key={props.part.accountId} {...props} />
  );

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(
      type === SubmissionType.FILE ? GenericDefaultFileOptions : GenericDefaultNotificationOptions
    );
  }
}
