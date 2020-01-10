import React from 'react';
import { UserAccountDto } from '../../../../electron-app/src/account/account.interface';
import { SubmissionSectionProps } from '../../views/submissions/interfaces/submission-section.interface';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';

export interface LoginDialogProps {
    account: UserAccountDto;
    url?: string;
    data?: any;
}

export interface Website {
  name: string;
  supportsAdditionalFiles: boolean;
  LoginDialog: (props: LoginDialogProps) => JSX.Element;
  FileSubmissionForm: (props: SubmissionSectionProps<FileSubmission, any>) => JSX.Element;
  NotificationSubmissionForm?: (props: SubmissionSectionProps<Submission, any>) => JSX.Element;
  getDefaults(): any;
}
