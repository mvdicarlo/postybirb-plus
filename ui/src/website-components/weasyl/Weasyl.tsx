import React from 'react';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { FileSubmissionSectionProps } from '../../views/submissions/interfaces/file-submission-section.interface';
import { DefaultWeasylSubmissionOptions } from '../../../../electron-app/src/websites/weasyl/weasyl.interface';

export class Weasyl implements Website {
  name: string = 'Weasyl';
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.weasyl.com/signin" {...props} />
  );

  FileSubmissionForm = (props: FileSubmissionSectionProps<any>) => (
    <WeasylFileSubmissionForm key={props.part.accountId} {...props} />
  );
}

interface WeasylFileSubmissionState {}

export class WeasylFileSubmissionForm extends React.Component<
  FileSubmissionSectionProps<any>,
  WeasylFileSubmissionState
> {
  state: WeasylFileSubmissionState = {};
  private readonly defaultOptions: DefaultWeasylSubmissionOptions = {
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

  render() {
    return <div>Weasyl Form!</div>;
  }
}
