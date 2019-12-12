import React from 'react';
import { UserAccountDto } from '../../../../electron-app/src/account/account.interface';
import { FileSubmissionSectionProps } from '../../views/submissions/interfaces/file-submission-section.interface';

export interface LoginDialogProps {
    account: UserAccountDto;
    url?: string;
    data?: any;
}

export interface Website {
  name: string;
  LoginDialog: (props: LoginDialogProps) => JSX.Element;
  FileSubmissionForm: (props: FileSubmissionSectionProps<any>) => JSX.Element;
  getDefaults(): any;
}
