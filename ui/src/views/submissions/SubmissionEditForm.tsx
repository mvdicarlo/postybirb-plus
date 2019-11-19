import React from 'react';
import { Match } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/file-submission.interface';
import { headerStore } from '../../stores/header.store';
import { LoginStatusStore } from '../../stores/login-status.store';
import { SubmissionStore } from '../../stores/file-submission.store';
import {
  SubmissionPart,
  DefaultOptions
} from '../../../../electron-app/src/submission/interfaces/submission-part.interface';
import { Form, Button } from 'antd';
import { SubmissionPackage } from '../../../../electron-app/src/submission/interfaces/submission-package.interface';
import DefaultFormSection from './form-sections/DefaultFormSection';
import SubmissionService from '../../services/submission.service';

interface Props {
  match?: Match;
  loginStatusStore?: LoginStatusStore;
}

interface State {
  submission: FileSubmission | null;
  parts: Array<SubmissionPart<any>>;
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
    parts: [],
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

  findPart(partName: string): SubmissionPart<any> {
    const part: any = this.state.parts.find(p => p.accountId === 'default');
    return part;
  }

  onUpdate = updatePart => {
    const parts = [...this.state.parts];
    const index = parts.findIndex(p => p.accountId === updatePart.accountId);
    if (index !== -1) {
      parts[index].data = updatePart.data;
    }

    this.setState({ parts, touched: true });
  };

  onSubmit = () => {
    if (this.state.touched) {
      this.setState({ loading: true });
      SubmissionService.updateSubmission({
        parts: this.state.parts,
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
      this.defaultOptions = this.findPart('default').data;

      headerStore.updateHeaderState({
        title: 'Edit Submission',
        routes: [
          {
            path: '/submissions',
            breadcrumbName: 'Submissions'
          },
          {
            path: `/edit/submission/${this.id}`,
            breadcrumbName: `${this.state.submission!.title}`
          }
        ]
      });

      return (
        <div>
          <div className="mb-2">
            <Button onClick={this.onSubmit} type="primary" disabled={!this.state.touched}>
              Save
            </Button>
          </div>
          <Form layout="vertical">
            <DefaultFormSection part={this.findPart('default')} onUpdate={this.onUpdate} />
          </Form>
        </div>
      );
    }
    return <div></div>;
  }
}
