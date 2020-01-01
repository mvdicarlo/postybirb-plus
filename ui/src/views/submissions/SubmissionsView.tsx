import React from 'react';
import * as _ from 'lodash';
import { Submissions } from './Submissions';
import { RcFile } from 'antd/lib/upload';
import { headerStore } from '../../stores/header.store';
import { SubmissionStore } from '../../stores/submission.store';
import { inject, observer } from 'mobx-react';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { Match } from 'react-router-dom';
import { Upload, Icon, message, Tabs, Button, Badge, Modal, Input } from 'antd';
import SubmissionService from '../../services/submission.service';
import ScheduledSubmissions from './ScheduledSubmissions';
import { uiStore } from '../../stores/ui.store';
const { Dragger } = Upload;

interface Props {
  submissionStore?: SubmissionStore;
  match: Match;
}

@inject('submissionStore')
@observer
export default class SubmissionView extends React.Component<Props> {
  type: SubmissionType = SubmissionType.FILE;
  defaultKey: string = 'submissions';

  constructor(props: Props) {
    super(props);
    this.defaultKey = props.match.params.view || 'submissions';
    uiStore.setActiveNav('update'); // force an update
    switch (props.match.path.split('/').pop()) {
      case SubmissionType.FILE:
        this.type = SubmissionType.FILE;
        break;
      case SubmissionType.NOTIFICATION:
        this.type = SubmissionType.NOTIFICATION;
        break;
    }
  }

  render() {
    headerStore.updateHeaderState({
      title: 'Submissions',
      routes: [
        {
          path: `/${this.type}`,
          breadcrumbName: `${_.capitalize(this.type)} Submissions`
        }
      ]
    });

    const submissions =
      this.type === SubmissionType.FILE
        ? this.props.submissionStore!.fileSubmissions
        : this.props.submissionStore!.notificationSubmissions;

    const editableSubmissions = submissions.filter(
      s => !s.submission.isPosting && !s.submission.schedule.isScheduled
    );

    const scheduledSubmissions = submissions.filter(
      s => !s.submission.isPosting && s.submission.schedule.isScheduled
    );

    const queuedSubmissions = submissions.filter(s => s.submission.isPosting);

    return (
      <Tabs defaultActiveKey={this.defaultKey}>
        <Tabs.TabPane
          tab={
            <div>
              <span className="mr-1">Submissions</span>
              <Badge count={editableSubmissions.length} />
            </div>
          }
          key="submissions"
        >
          <div className="submission-view">
            <Submissions
              isLoading={this.props.submissionStore!.isLoading}
              submissions={editableSubmissions}
            />
            <div className="uploader">
              {this.type === SubmissionType.FILE ? (
                <FileSubmissionCreator />
              ) : (
                <NotificationSubmissionCreator />
              )}
            </div>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={
            <div>
              <span className="mr-1">Scheduled</span>
              <Badge count={scheduledSubmissions.length} />
            </div>
          }
          key="scheduled"
        >
          <div className="scheduled-view">
            <ScheduledSubmissions submissions={scheduledSubmissions} />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={
            <div>
              <span className="mr-1">Posting</span>
              <Badge count={queuedSubmissions.length} />
            </div>
          }
          key="posting"
        >
          TBD
        </Tabs.TabPane>
      </Tabs>
    );
  }
}

interface FileSubmissionCreateState {
  canCopyClipboard: boolean;
}

class FileSubmissionCreator extends React.Component<any, FileSubmissionCreateState> {
  state: FileSubmissionCreateState = {
    canCopyClipboard: window.electron.clipboard.availableFormats().includes('image/png')
  };

  private clipboardCheckInterval: any;
  private uploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    action: (file: RcFile) =>
      Promise.resolve(
        `https://localhost:${window['PORT']}/submission/create/${
          SubmissionType.FILE
        }?path=${encodeURIComponent(file['path'])}`
      ),
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    }
  };

  constructor(props: any) {
    super(props);
    this.clipboardCheckInterval = setInterval(() => {
      if (window.electron.clipboard.availableFormats().includes('image/png')) {
        if (!this.state.canCopyClipboard) {
          this.setState({ canCopyClipboard: true });
        }
      } else if (this.state.canCopyClipboard) {
        this.setState({ canCopyClipboard: false });
      }
    }, 2000);
  }

  componentWillUnmount() {
    clearInterval(this.clipboardCheckInterval);
  }

  createFromClipboard() {
    SubmissionService.createFromClipboard()
      .then(() => message.success('Submission created.'))
      .catch(() => message.error('Failed to create submission.'));
  }

  render() {
    return (
      <div>
        <Dragger {...this.uploadProps}>
          <p className="ant-light-upload-drag-icon ant-dark-upload-drag-icon">
            <Icon type="inbox" />
          </p>
          <p className="ant-light-upload-text ant-dark-upload-text">
            Click or drag file to this area to create a submission
          </p>
        </Dragger>
        <div className="mt-1">
          <Button
            disabled={!this.state.canCopyClipboard}
            onClick={this.createFromClipboard.bind(this)}
            block
          >
            <Icon type="copy" />
            Copy from clipboard
          </Button>
        </div>
      </div>
    );
  }
}

interface NotificationSubmissionCreateState {
  modalVisible: boolean;
  value: string;
}

class NotificationSubmissionCreator extends React.Component<
  any,
  NotificationSubmissionCreateState
> {
  state: NotificationSubmissionCreateState = {
    modalVisible: false,
    value: ''
  };

  createSubmission() {
    if (this.state.value) {
      SubmissionService.create(SubmissionType.NOTIFICATION, this.state.value)
        .then(() => message.success('Submission created.'))
        .catch(() => message.error('Failed to create submission.'));
      this.hideModal();
    }
  }

  hideModal() {
    this.setState({ modalVisible: false });
  }

  showModal() {
    this.setState({ modalVisible: true, value: '' });
  }

  onNameChange({ target }) {
    this.setState({ value: target.value });
  }

  render() {
    return (
      <div>
        <Button onClick={this.showModal.bind(this)} type="primary" block>
          Create Notification
        </Button>
        <Modal
          destroyOnClose={true}
          okButtonProps={{ disabled: !this.state.value.length }}
          onCancel={this.hideModal.bind(this)}
          onOk={this.createSubmission.bind(this)}
          title="Notification Name"
          visible={this.state.modalVisible}
        >
          <Input
            className="w-full"
            value={this.state.value}
            onChange={this.onNameChange.bind(this)}
          />
        </Modal>
      </div>
    );
  }
}
