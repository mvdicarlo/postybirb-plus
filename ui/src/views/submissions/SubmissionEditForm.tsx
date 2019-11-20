import React from 'react';
import * as _ from 'lodash';
import DefaultFormSection from './form-sections/DefaultFormSection';
import SubmissionService from '../../services/submission.service';
import SubmissionUtil from '../../utils/submission.util';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { LoginStatusStore } from '../../stores/login-status.store';
import { Match } from 'react-router-dom';
import { headerStore } from '../../stores/header.store';
import { inject, observer } from 'mobx-react';
import {
  SubmissionPart,
  DefaultOptions
} from '../../../../electron-app/src/submission/interfaces/submission-part.interface';
import { Form, Button, Typography } from 'antd';

interface Props {
  match?: Match;
  loginStatusStore?: LoginStatusStore;
}

interface State {
  submission: FileSubmission | null;
  parts: { [key: string]: SubmissionPart<any> };
  problems: { [key: string]: any };
  loading: boolean;
  touched: boolean;
}

@inject('loginStatusStore')
@observer
export default class SubmissionEditForm extends React.Component<Props, State> {
  private id: string;
  private defaultOptions: DefaultOptions = {
    tags: {
      extendDefault: false,
      value: []
    },
    description: {
      overwriteDefault: false,
      value: ''
    },
    rating: null,
    title: ''
  };

  state: State = {
    submission: null,
    problems: {},
    parts: {},
    loading: true,
    touched: false
  };

  constructor(props: Props) {
    super(props);
    this.id = props.match!.params.id;
    SubmissionService.getFileSubmissionPackage(this.id).then(({ data }) => {
      this.setState({
        ...this.state,
        ...data,
        loading: false
      });
    });
  }

  onUpdate = updatePart => {
    const parts = _.cloneDeep(this.state.parts);
    parts[updatePart.accountId] = updatePart;
    this.setState({ parts, touched: true });
  };

  onSubmit = () => {
    if (this.state.touched) {
      this.setState({ loading: true });
      SubmissionService.updateSubmission({
        parts: Object.values(this.state.parts),
        id: this.id
      })
        .then(({ data }) => {
          this.setState({
            ...this.state,
            ...data,
            loading: false,
            touched: false
          });
        })
        .catch(() => {
          // TODO alert
          this.setState({ loading: false });
        });
    }
  };

  render() {
    if (!this.state.loading) {
      this.defaultOptions = this.state.parts.default.data;

      headerStore.updateHeaderState({
        title: 'Edit Submission',
        routes: [
          {
            path: '/submissions',
            breadcrumbName: 'Submissions'
          },
          {
            path: `/edit/submission/${this.id}`,
            breadcrumbName: SubmissionUtil.getFileSubmissionTitle(this.state)
          }
        ]
      });

      return (
        <div>
          <Form layout="vertical">
            <Typography.Title level={3}>Defaults</Typography.Title>
            <DefaultFormSection part={this.state.parts.default} onUpdate={this.onUpdate} />
          </Form>
          <div className="py-2 text-right z-10 sticky bg-white" style={{ bottom: '0' }}>
            <Button onClick={this.onSubmit} type="primary" disabled={!this.state.touched}>
              Save
            </Button>
          </div>
        </div>
      );
    }
    return <div></div>;
  }
}
