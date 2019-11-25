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
import { uiStore } from '../../stores/ui.store';
import { SubmissionPackage } from '../../../../electron-app/src/submission/interfaces/submission-package.interface';
import {
  SubmissionPart,
  DefaultOptions
} from '../../../../electron-app/src/submission/interfaces/submission-part.interface';
import { Form, Button, Typography, Spin, message } from 'antd';

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
  private original!: SubmissionPackage<FileSubmission>;
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
      this.original = _.cloneDeep(data);
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
    const isTouched: boolean = !_.isEqual(parts, this.original.parts);
    this.setState({ parts, touched: isTouched });
    uiStore.setPendingChanges(isTouched);
  };

  onSubmit = () => {
    if (this.state.touched) {
      this.setState({ loading: true });
      SubmissionService.updateSubmission({
        parts: Object.values(this.state.parts),
        id: this.id
      })
        .then(({ data }) => {
          this.original = _.cloneDeep(data);
          this.setState({
            ...this.state,
            ...data,
            loading: false,
            touched: false
          });
          message.success('Submission was successfully saved.');
          uiStore.setPendingChanges(false);
        })
        .catch(() => {
          this.setState({ loading: false });
          message.error('A problem occurred when trying to save the submission.');
        });
    }
  };

  componentWillUnmount() {
    uiStore.setPendingChanges(false);
  }

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
          <Spin spinning={this.state.loading} delay={500}>
            <Form layout="vertical">
              <Typography.Title level={3}>Defaults</Typography.Title>
              <DefaultFormSection part={this.state.parts.default} onUpdate={this.onUpdate} />
            </Form>
            <div className="py-2 text-right z-10 sticky bg-white" style={{ bottom: '0' }}>
              <Button onClick={this.onSubmit} type="primary" disabled={!this.state.touched}>
                Save
              </Button>
            </div>
          </Spin>
        </div>
      );
    }
    return <div></div>;
  }
}