import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { DefaultFileOptions } from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';

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

export class Route50 implements Website {
  internalName: string = 'Route50';
  name: string = 'Route 50';
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
    return _.cloneDeep(defaultOptions);
  }
}
