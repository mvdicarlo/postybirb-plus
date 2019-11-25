import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { FileSubmissionSectionProps } from '../../views/submissions/interfaces/file-submission-section.interface';
import { DefaultWeasylSubmissionOptions } from '../../../../electron-app/src/websites/weasyl/weasyl.interface';

const defaultOptions: DefaultWeasylSubmissionOptions = {
  notify: true,
  critique: false,
  folder: null,
  category: null,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  },
  rating: null
};

export class Weasyl implements Website {
  name: string = 'Weasyl';
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.weasyl.com/signin" {...props} />
  );

  FileSubmissionForm = (props: FileSubmissionSectionProps<any>) => (
    <WeasylFileSubmissionForm key={props.part.accountId} {...props} />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }

}

interface WeasylFileSubmissionState {}

export class WeasylFileSubmissionForm extends React.Component<
  FileSubmissionSectionProps<any>,
  WeasylFileSubmissionState
> {
  state: WeasylFileSubmissionState = {};
  private readonly defaultOptions: DefaultWeasylSubmissionOptions = _.cloneDeep(defaultOptions);

  render() {
    return <div>Weasyl Form!</div>;
  }
}
