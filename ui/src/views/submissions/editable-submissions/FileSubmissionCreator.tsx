import React from 'react';
import SubmissionService from '../../../services/submission.service';
import { SubmissionType } from '../../../shared/enums/submission-type.enum';
import { Button, Input, message, Icon, Upload } from 'antd';
import { RcFile } from 'antd/lib/upload';
import Axios from 'axios';
const { Dragger } = Upload;

interface FileSubmissionCreateState {
  canCopyClipboard: boolean;
  importUrl: string;
}

export class FileSubmissionCreator extends React.Component<any, FileSubmissionCreateState> {
  state: FileSubmissionCreateState = {
    canCopyClipboard: window.electron.clipboard.availableFormats().includes('image/png'),
    importUrl: ''
  };
  private clipboardCheckInterval: any;
  private uploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    beforeUpload: (file: RcFile) => {
      SubmissionService.create({
        type: SubmissionType.FILE,
        file: file,
        path: file['path']
      })
        .then(() => {
          message.success(`${file.name} file uploaded successfully.`);
        })
        .catch(() => {
          message.error(`${file.name} file upload failed.`);
        });
      return Promise.reject(); // don't want to upload using component method
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
  async createFromImportURL() {
    const importUrl = this.state.importUrl.trim();
    if (importUrl.length) {
      try {
        const filename = importUrl.split('/').pop() || 'import';
        const res = await Axios.get(importUrl, { responseType: 'arraybuffer' });
        const blob: Blob = new Blob([res.data], { type: res.headers['content-type'] });
        const file: File = new File([blob], filename, {
          type: res.headers['content-type']
        });
        SubmissionService.create({
          type: SubmissionType.FILE,
          title: filename,
          file
        })
          .then(() => {
            message.success('Image imported.');
          })
          .catch(() => {
            message.error('Unable to load file for import.');
          });
      } catch (err) {
        message.error('Unable to load file for import.');
      }
    }
  }
  render() {
    return (
      <div>
        <Dragger {...this.uploadProps} headers={{ Authorization: window.AUTH_ID }}>
          <p className="ant-upload-drag-icon">
            <Icon type="inbox" />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to create a submission</p>
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
        <div className="mt-1 flex">
          <Input
            className="mr-1"
            placeholder="Import From URL"
            style={{ flex: 10 }}
            defaultValue={this.state.importUrl}
            onChange={e => this.setState({ importUrl: e.target.value })}
          />
          <Button
            className="block"
            disabled={!this.state.importUrl}
            onClick={this.createFromImportURL.bind(this)}
          >
            Import
          </Button>
        </div>
      </div>
    );
  }
}
