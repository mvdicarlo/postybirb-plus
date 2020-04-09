import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { FurifficOptions } from '../../../../electron-app/src/websites/furiffic/furiffic.interface';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { DefaultOptions } from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';

const defaultOptions: FurifficOptions = {
  title: undefined,
  useThumbnail: true,
  autoScale: true,
  rating: null,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  }
};

export class Furiffic implements Website {
  internalName: string = 'Furiffic';
  name: string = 'Furiffic';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.furiffic.com/" {...props} />
  );

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, FurifficOptions>) => (
    <GenericFileSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: 'general',
            name: 'Tame'
          },
          {
            value: 'mature',
            name: 'Mature'
          },
          {
            value: 'adult',
            name: 'Adult'
          }
        ]
      }}
    />
  );

  NotificationSubmissionForm = (props: SubmissionSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: 'general',
            name: 'Tame'
          },
          {
            value: 'mature',
            name: 'Mature'
          },
          {
            value: 'adult',
            name: 'Adult'
          }
        ]
      }}
    />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
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
