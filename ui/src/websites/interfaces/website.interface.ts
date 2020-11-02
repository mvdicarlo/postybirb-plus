import { UserAccountDto } from 'postybirb-commons';
import { FileSubmission } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import { SubmissionType } from 'postybirb-commons';

export interface LoginDialogProps {
  account: UserAccountDto;
  url?: string;
  data?: any;
}

export interface Website {
  internalName: string;
  loginUrl: string;
  name: string;
  supportsAdditionalFiles?: boolean;
  supportsTags?: boolean;
  LoginDialog: (props: LoginDialogProps) => JSX.Element;
  LoginHelp?: (props: LoginDialogProps) => JSX.Element;
  FileSubmissionForm: (props: WebsiteSectionProps<FileSubmission, any>) => JSX.Element;
  NotificationSubmissionForm?: (props: WebsiteSectionProps<Submission, any>) => JSX.Element;
  getDefaults(type: SubmissionType): any;
  supportsTextType?(type: string);
}
