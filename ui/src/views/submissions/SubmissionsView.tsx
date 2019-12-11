import React from 'react';
import { Submissions } from './Submissions';
import { RcFile } from 'antd/lib/upload';
import { headerStore } from '../../stores/header.store';
import { SubmissionStore } from '../../stores/submission.store';
import { inject, observer } from 'mobx-react';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import './SubmissionsView.css';

import { Upload, Icon, message, Tabs, Button, Badge } from 'antd';
import SubmissionService from '../../services/submission.service';
const { Dragger } = Upload;

interface Props {
  submissionStore?: SubmissionStore;
}

interface State {
  canCopyClipboard: boolean;
}

@inject('submissionStore')
@observer
export default class SubmissionView extends React.Component<Props, State> {
  state: State = {
    canCopyClipboard: window.electron.clipboard.availableFormats().includes('image/png')
  };

  private uploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    action: (file: RcFile) =>
      Promise.resolve(
        `http://localhost:${window['PORT']}/submission/create/${
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

  private clipboardCheckInterval: any;

  constructor(props) {
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

  createFromClipboard() {
    SubmissionService.createFromClipboard()
      .then(() => message.success('Submission created.'))
      .catch(() => message.error('Failed to create submission.'));
  }

  componentWillUnmount() {
    clearInterval(this.clipboardCheckInterval);
  }

  render() {
    headerStore.updateHeaderState({
      title: 'Submissions',
      routes: [
        {
          path: '/submissions',
          breadcrumbName: 'Submissions'
        }
      ]
    });

    const submissions = this.props.submissionStore!.fileSubmissions;

    return (
      <Tabs>
        <Tabs.TabPane
          tab={
            <div>
              <span className="mr-1">Submissions</span>
              <Badge
                count={
                  submissions.filter(
                    s => !s.submission.isPosting && !s.submission.schedule.isScheduled
                  ).length
                }
              />
            </div>
          }
          key="submissions"
        >
          <div className="submission-view">
            <Submissions
              isLoading={this.props.submissionStore!.isLoading}
              submissions={submissions}
            />
            <div className="uploader">
              <Dragger {...this.uploadProps}>
                <p className="ant-upload-drag-icon">
                  <Icon type="inbox" />
                </p>
                <p className="ant-upload-text">
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
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={
            <div>
              <span className="mr-1">Scheduled</span>
              <Badge
                count={
                  submissions.filter(
                    s => !s.submission.isPosting && s.submission.schedule.isScheduled
                  ).length
                }
              />
            </div>
          }
          key="scheduled"
        >
          TBD
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={
            <div>
              <span className="mr-1">Posting</span>
              <Badge count={submissions.filter(s => s.submission.isPosting).length} />
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
