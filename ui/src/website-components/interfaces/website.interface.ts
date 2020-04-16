import { UserAccountDto } from '../../../../electron-app/src/account/interfaces/user-account.dto.interface';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';

export interface LoginDialogProps {
  account: UserAccountDto;
  url?: string;
  data?: any;
}

export interface Website {
  internalName: string;
  name: string;
  supportsAdditionalFiles: boolean;
  supportsTags: boolean;
  LoginDialog: (props: LoginDialogProps) => JSX.Element;
  FileSubmissionForm: (props: WebsiteSectionProps<FileSubmission, any>) => JSX.Element;
  NotificationSubmissionForm?: (props: WebsiteSectionProps<Submission, any>) => JSX.Element;
  getDefaults(): any;
  supportsTextType?(type: string);
}
