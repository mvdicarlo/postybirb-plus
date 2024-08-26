import { Form, Select, Checkbox, Input } from 'antd';
import {
  FileSubmission,
  SubmissionRating,
  CohostFileOptions,
  CohostNotificationOptions,
  Submission
} from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';
import SpoilerTextInput from '../../views/submissions/submission-forms/form-components/SpoilerTextInput';

export class Cohost extends WebsiteImpl {
  internalName: string = 'Cohost';
  loginUrl: string = 'https://cohost.org';
  name: string = 'Cohost';
  supportsTags: boolean = true;
  supportsAdditionalFiles: boolean = true;

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, CohostFileOptions>) => (
    <CohostFileSubmissionForm
      key={props.part.accountId}
      hideThumbnailOptions={true}
      tagOptions={{show: true}}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'General'
          },
          {
            value: SubmissionRating.ADULT,
            name: '18+'
          }
        ]
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (
    props: WebsiteSectionProps<Submission, CohostNotificationOptions>
  ) => (
    <CohostNotificationSubmissionForm
      key={props.part.accountId}
      {...props}
      tagOptions={{show: true}}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'General'
          },
          {
            value: SubmissionRating.ADULT,
            name: '18+'
          }
        ]
      }}
    />
  );
}

export class CohostNotificationSubmissionForm extends GenericSubmissionSection<
  CohostNotificationOptions
> {
  renderRightForm(data: CohostNotificationOptions) {
    const elements = super.renderRightForm(data);
    return elements;
  }

  renderLeftForm(data: CohostNotificationOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <SpoilerTextInput
        overwriteDefault={data.spoilerTextOverwrite}
        spoilerText={data.spoilerText}
        onChangeOverwriteDefault={this.setValue.bind(this, 'spoilerTextOverwrite')}
        onChangeSpoilerText={this.setValue.bind(this, 'spoilerText')}
      ></SpoilerTextInput>,
    );
    return elements;
  }
}

export class CohostFileSubmissionForm extends GenericFileSubmissionSection<CohostFileOptions> {
  renderRightForm(data: CohostFileOptions) {
    const elements = super.renderRightForm(data);
    return elements;
  }

  renderLeftForm(data: CohostFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <SpoilerTextInput
        overwriteDefault={data.spoilerTextOverwrite}
        spoilerText={data.spoilerText}
        onChangeOverwriteDefault={this.setValue.bind(this, 'spoilerTextOverwrite')}
        onChangeSpoilerText={this.setValue.bind(this, 'spoilerText')}
      ></SpoilerTextInput>,
    );
    return elements;
  }
}
