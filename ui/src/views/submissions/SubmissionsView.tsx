import React from 'react';
import { Submissions } from './Submissions';
import { Upload, Icon, message } from 'antd';
import { RcFile } from 'antd/lib/upload';
import { headerStore } from '../../stores/header.store';
import './SubmissionsView.css';

const { Dragger } = Upload;

export default class SubmissionView extends React.Component {
  private uploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    action: (file: RcFile) =>
      Promise.resolve(
        `http://localhost:${
          window['PORT']
        }/file_submission/create/${encodeURIComponent(file['path'])}`
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
      <div className="submission-view">
        <Submissions></Submissions>
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
    );
  }
}
