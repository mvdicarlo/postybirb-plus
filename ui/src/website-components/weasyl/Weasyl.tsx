import React from 'react';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { FileSubmissionSectionProps } from '../../views/submissions/interfaces/file-submission-section.interface';

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

  render() {
    return <div>Weasyl Form!</div>;
  }
}
