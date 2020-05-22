import _ from 'lodash';
import React from 'react';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import {
  DefaultFileOptions,
  DefaultOptions
} from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps, Website } from '../interfaces/website.interface';
import CustomAccountInfo from './CustomAccountInfo';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
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
