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
import { WebsiteImpl } from '../website.base';

export class Furiffic extends WebsiteImpl {
  internalName: string = 'Furiffic';
  name: string = 'Furiffic';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = 'https://www.furiffic.com/';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, DefaultFileOptions>) => (
    <GenericFileSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'Tame'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Mature'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Adult'
          }
        ]
      }}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'Tame'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Mature'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Adult'
          }
        ]
      }}
    />
  );

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
