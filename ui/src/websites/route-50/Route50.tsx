import { DefaultFileOptions, FileSubmission } from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class Route50 extends WebsiteImpl {
  internalName: string = 'Route50';
  name: string = 'Route 50';
  supportsTags = true;
  loginUrl: string = 'http://route50.net/login';

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
}
