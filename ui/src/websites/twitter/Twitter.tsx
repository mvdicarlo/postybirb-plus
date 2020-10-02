import {
  DefaultFileOptions,
  DefaultOptions,
  FileSubmission,
  Submission,
  SubmissionRating
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { LoginDialogProps } from '../interfaces/website.interface';
import { WebsiteImpl } from '../website.base';
import { TwitterLogin } from './TwitterLogin';

export class Twitter extends WebsiteImpl {
  internalName: string = 'Twitter';
  name: string = 'Twitter';
  supportsAdditionalFiles: boolean = true;
  supportsTags = false;
  loginUrl: string = '';

  LoginDialog = (props: LoginDialogProps) => <TwitterLogin {...props} />;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DefaultFileOptions>) => (
    <GenericFileSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          { name: 'Safe', value: SubmissionRating.GENERAL },
          { name: 'Sensitive', value: SubmissionRating.ADULT }
        ]
      }}
      tagOptions={{ show: false }}
      descriptionOptions={{ show: true, options: { anchorLength: 23 } }}
      hideThumbnailOptions={true}
      hideTitle={true}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      hideTitle={true}
      tagOptions={{ show: false }}
      descriptionOptions={{ show: true, options: { anchorLength: 23 } }}
      ratingOptions={{
        show: true,
        ratings: [
          { name: 'Safe', value: SubmissionRating.GENERAL },
          { name: 'Sensitive', value: SubmissionRating.ADULT }
        ]
      }}
    />
  );
}
