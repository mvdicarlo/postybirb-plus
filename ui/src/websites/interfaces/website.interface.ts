import { UserAccountDto } from '../../../../electron-app/src/server/account/interfaces/user-account.dto.interface';
import { FileSubmission } from '../../../../electron-app/src/server/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/server/submission/interfaces/submission.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import { SubmissionType } from '../../shared/enums/submission-type.enum';

export interface LoginDialogProps {
  account: UserAccountDto;
  url?: string;
  data?: any;
}

export interface Website {
  internalName: string;
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
