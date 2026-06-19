import {
  DefaultOptions,
  FileSubmission,
  InstagramFileOptions,
  Submission,
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import { InstagramLogin } from './InstagramLogin';

export class Instagram extends WebsiteImpl {
  internalName: string = 'Instagram';
  name: string = 'Instagram';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = 'https://www.instagram.com/accounts/login/';

  LoginDialog = (props: LoginDialogProps) => <InstagramLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, InstagramFileOptions>) => (
    <GenericFileSubmissionSection
      key={props.part.accountId}
      {...props}
      hideThumbnailOptions={true}
      ratingOptions={{ show: false }}
      tagOptions={{ show: true, options: { maxTags: 30 } }}
    />
  );

  NotificationSubmissionForm = undefined;
}
