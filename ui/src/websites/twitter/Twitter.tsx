import _ from 'lodash';
import React from 'react';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import {
  DefaultFileOptions,
  DefaultOptions
} from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps, Website } from '../interfaces/website.interface';
import { TwitterLogin } from './TwitterLogin';

export class Twitter implements Website {
  internalName: string = 'Twitter';
  name: string = 'Twitter';
  supportsAdditionalFiles: boolean = true;
  LoginDialog = (props: LoginDialogProps) => <TwitterLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DefaultFileOptions>) => (
    <GenericFileSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{ show: true, ratings: [{ name: 'Sensitive', value: 'adult' }] }}
      tagOptions={{ show: false }}
      descriptionOptions={{ show: true, options: { anchorLength: 23 } }}
      hideThumbnailOptions={true}
      hideTitle={true}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      hideTitle={true}
      tagOptions={{ show: false }}
      descriptionOptions={{ show: true, options: { anchorLength: 23 } }}
      ratingOptions={{ show: true, ratings: [{ name: 'Sensitive', value: 'adult' }] }}
    />
  );

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(
      type === SubmissionType.FILE ? GenericDefaultFileOptions : GenericDefaultNotificationOptions
    );
  }
}
