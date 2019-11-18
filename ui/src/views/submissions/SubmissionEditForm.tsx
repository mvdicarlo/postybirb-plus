import React from 'react';
import { Match } from 'react-router-dom';
import socket from '../../utils/websocket';
import SubmissionService from '../../services/submission.service';
import { Submission } from '../../../../electron-app/src/submission/submission.interface';

interface Props {
  match?: Match;
}

interface State {
  submission: Submission | null;
  submissionParts: any;
  problems: any;
}

export default class SubmissionEditForm extends React.Component<Props, State> {
  state: State = {
    submission: null,
    submissionParts: {},
    problems: {}
  };

  constructor(props) {
    super(props);
  }

  componentWillUnmount() {}

  render() {
    return <div>Submission!</div>;
  }
}
