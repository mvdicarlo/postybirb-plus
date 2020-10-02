import { Checkbox } from 'antd';
import { ArtconomyFileOptions, FileSubmission } from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteImpl } from '../website.base';

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
            value: '0',
            name: 'Clean/Safe'
          },
          {
            value: '1',
            name: 'Risque'
          },
          {
            value: '3',
            name: 'Adult Content'
          },
          {
            value: '4',
            name: 'Offensive/Disturbing'
          }
        ]
      }}
      key={props.part.accountId}
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
