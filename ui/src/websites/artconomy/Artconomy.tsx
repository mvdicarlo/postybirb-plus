import { Checkbox } from 'antd';
import {
  ArtconomyFileOptions,
  DefaultOptions,
  FileSubmission,
  Submission,
  SubmissionRating
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteImpl } from '../website.base';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';

export class Artconomy extends WebsiteImpl {
  internalName: string = 'Artconomy';
  name: string = 'Artconomy';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  loginUrl: string = 'https://artconomy.com/auth/login';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, ArtconomyFileOptions>) => (
    <ArtconomyFileSubmissionForm
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'Clean/Safe'
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Risque'
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Adult Content'
          },
          {
            value: SubmissionRating.EXTREME,
            name: 'Offensive/Disturbing'
          }
        ]
      }}
      key={props.part.accountId}
      {...props}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      tagOptions={{ show: false }}
      ratingOptions={{ show: false }}
      {...props}
    />
  );
}

export class ArtconomyFileSubmissionForm extends GenericFileSubmissionSection<
  ArtconomyFileOptions
> {
  renderLeftForm(data: ArtconomyFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.isArtist}
          onChange={this.handleCheckedChange.bind(this, 'isArtist')}
        >
          I made dis
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.commentsDisabled}
          onChange={this.handleCheckedChange.bind(this, 'commentsDisabled')}
        >
          Comments Disabled
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.private} onChange={this.handleCheckedChange.bind(this, 'private')}>
          Private
        </Checkbox>
      </div>
    );
    return elements;
  }
}
