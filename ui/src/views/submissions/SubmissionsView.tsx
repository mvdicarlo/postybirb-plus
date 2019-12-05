import React from 'react';
import { Submissions } from './Submissions';
import { RcFile } from 'antd/lib/upload';
import { headerStore } from '../../stores/header.store';
import { SubmissionStore } from '../../stores/submission.store';
import { inject, observer } from 'mobx-react';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import './SubmissionsView.css';

import { Upload, Icon, message, Tabs } from 'antd';
const { Dragger } = Upload;

interface Props {
  submissionStore?: SubmissionStore;
}

@inject('submissionStore')
@observer
export default class SubmissionView extends React.Component<Props> {
  private uploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    action: (file: RcFile) =>
      Promise.resolve(
        `http://localhost:${window['PORT']}/submission/create/${SubmissionType.FILE}?path=${encodeURIComponent(
          file['path']
        )}`
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

    return (
      <Tabs>
        <Tabs.TabPane tab="Submissions" key="submissions">
          <div className="submission-view">
            <Submissions
              isLoading={this.props.submissionStore!.isLoading}
              submissions={this.props.submissionStore!.all.filter(
                s => s.submission.type === SubmissionType.FILE
              )}
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
            </div>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Scheduled" key="scheduled">
          TBD
        </Tabs.TabPane>
        <Tabs.TabPane tab="Posting" key="posting">
          TBD
        </Tabs.TabPane>
      </Tabs>
    );
  }
}
