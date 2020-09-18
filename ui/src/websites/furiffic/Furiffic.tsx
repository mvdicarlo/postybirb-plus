import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { FileSubmission } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import {
  DefaultOptions,
  DefaultFileOptions
} from 'postybirb-commons';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import { SubmissionType, SubmissionRating } from 'postybirb-commons';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';

export class Furiffic implements Website {
  internalName: string = 'Furiffic';
  name: string = 'Furiffic';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.furiffic.com/" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DefaultFileOptions>) => (
    <GenericFileSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'Tame'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Mature'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Adult'
          }
        ]
      }}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'Tame'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Mature'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Adult'
          }
        ]
      }}
    />
  );

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(
      type === SubmissionType.FILE ? GenericDefaultFileOptions : GenericDefaultNotificationOptions
    );
  }

  supportsTextType(type: string): boolean {
    return [
      'text/plain',
      'text/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/rtf',
      'text/richtext'
    ].includes(type);
  }
}
