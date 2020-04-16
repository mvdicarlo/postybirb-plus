import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import {
  DefaultFileOptions,
  DefaultOptions
} from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';

const defaultOptions: DefaultFileOptions = {
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

export class KoFi implements Website {
  internalName: string = 'KoFi';
  name: string = 'Ko-fi';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://ko-fi.com/account/login" {...props} />
  );

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, DefaultFileOptions>) => (
    <GenericFileSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{ show: false }}
      hideThumbnailOptions={true}
    />
  );

  NotificationSubmissionForm = (props: SubmissionSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: false
      }}
    />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}
