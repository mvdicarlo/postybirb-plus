import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { Checkbox } from 'antd';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { ArtconomyOptions } from '../../../../electron-app/src/websites/artconomy/artconomy.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import ArtconomyLogin from "./ArtconomyLogin";

const defaultOptions: ArtconomyOptions = {
  ...GenericDefaultFileOptions,
  comments_disabled: false,
  is_artist: true,
  private: false,
};

export class Artconomy implements Website {
  internalName: string = 'Artconomy';
  name: string = 'Artconomy';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => <ArtconomyLogin {...props} />;
  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, ArtconomyOptions>) => (
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

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class ArtconomyFileSubmissionForm extends GenericFileSubmissionSection<ArtconomyOptions> {

  renderLeftForm(data: ArtconomyOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox
          checked={data.is_artist}
          onChange={this.handleCheckedChange.bind(this, 'is_artist')}
        >
          I made dis
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.comments_disabled}
          onChange={this.handleCheckedChange.bind(this, 'comments_disabled')}
        >
          Comments Disabled
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.private} onChange={this.handleCheckedChange.bind(this, 'private')}>
          Private
        </Checkbox>
      </div>,
    );
    return elements;
  }
}
