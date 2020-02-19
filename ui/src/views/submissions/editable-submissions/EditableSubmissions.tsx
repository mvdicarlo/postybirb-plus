import React from 'react';
import SubmissionService from '../../../services/submission.service';
import SubmissionUtil from '../../../utils/submission.util';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import { SubmissionPackage } from '../../../../../electron-app/src/submission/interfaces/submission-package.interface';
import moment from 'moment';
import SubmissionSelectModal from '../submission-select/SubmissionSelectModal';
import { SubmissionType } from '../../../shared/enums/submission-type.enum';
import { Submission } from '../../../../../electron-app/src/submission/interfaces/submission.interface';
import PostService from '../../../services/post.service';
import { submissionStore } from '../../../stores/submission.store';
import {
  Button,
  DatePicker,
  Input,
  List,
  message,
  Form,
  InputNumber,
  Icon,
  Modal,
  Upload
} from 'antd';
import { EditableSubmissionListItem } from './EditableSubmissionListItem';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { RcFile } from 'antd/lib/upload';
const { Dragger } = Upload;

interface Props {
  submissions: SubmissionPackage<any>[];
  isLoading: boolean;
  type: SubmissionType;
}

interface State {
  search: string;
  deleteModalVisible: boolean;
  postModalVisible: boolean;
  scheduleManyModalVisible: boolean;
}

export class EditableSubmissions extends React.Component<Props, State> {
  state: State = {
    search: '',
    deleteModalVisible: false,
    postModalVisible: false,
    scheduleManyModalVisible: false
  };

  scheduleManyPeriod: any = {
    d: 0,
    h: 0,
    m: 1,
    time: moment()
  };

  handleSearch = ({ target }) => this.setState({ search: target.value.toLowerCase() });

  deleteSubmissions(submissions: SubmissionPackage<any>[]) {
    this.setState({ deleteModalVisible: false });
    Promise.all(submissions.map(s => SubmissionService.deleteSubmission(s.submission._id))).finally(
      () => message.success('Submissions deleted.')
    );
  }

  async postSubmissions(submissions: SubmissionPackage<any>[]) {
    this.setState({ postModalVisible: false });
    for (let i = 0; i < submissions.length; i++) {
      try {
        await PostService.queue(submissions[i].submission._id);
      } catch {
        message.error(`Unable to queue ${SubmissionUtil.getSubmissionTitle(submissions[i])}.`);
      }
    }

    message.success('Submissions queued.');
  }

  scheduleSubmissions(submissions: SubmissionPackage<any>[]) {
    const postAt = moment(this.scheduleManyPeriod.time.valueOf());
    this.setState({ scheduleManyModalVisible: false });
    Promise.all(
      submissions.map(s => {
        const promise = SubmissionService.schedule(s.submission._id, true, postAt.valueOf());
        postAt.add(this.scheduleManyPeriod.d, 'days');
        postAt.add(this.scheduleManyPeriod.h, 'hours');
        postAt.add(this.scheduleManyPeriod.m, 'minutes');
        return promise;
      })
    ).finally(() => {
      message.success('Submissions scheduled.');
    });
  }

  onDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) {
      return;
    }

    if (source.droppableId !== destination.droppableId) {
      return;
    }

    if (source.index === destination.index) {
      return;
    }

    submissionStore.changeOrder(result.draggableId, source.index, destination.index);
  }

  render() {
    const submissions = this.props.submissions.filter(s =>
      SubmissionUtil.getSubmissionTitle(s)
        .toLowerCase()
        .includes(this.state.search)
    );
    return (
      <div>
        <div className="uploader mb-2">
          {this.props.type === SubmissionType.FILE ? (
            <FileSubmissionCreator />
          ) : (
            <NotificationSubmissionCreator />
          )}
        </div>
        <div>
          <DragDropContext onDragEnd={this.onDragEnd.bind(this)}>
            <Droppable droppableId="submissions">
              {provided => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <List
                    footer={this.props.children}
                    itemLayout="vertical"
                    loading={this.props.isLoading}
                    dataSource={submissions}
                    renderItem={(item: SubmissionPackage<Submission>) => (
                      <EditableSubmissionListItem item={item} />
                    )}
                    header={
                      <div className="flex">
                        <div style={{ flex: 10 }}>
                          <Input.Search onChange={this.handleSearch} style={{ width: 200 }} />
                        </div>
                        <div className="text-right">
                          <Link
                            className={submissions.length ? 'pointer-none' : ''}
                            to={`/edit/multiple-submissions/${_.get(
                              submissions,
                              '[0].submission.type',
                              SubmissionType.FILE
                            )}`}
                          >
                            <Button type="default" disabled={!submissions.length} className="mr-1">
                              Edit Many
                            </Button>
                          </Link>
                          <Button
                            className="mr-1"
                            type="danger"
                            onClick={() => this.setState({ deleteModalVisible: true })}
                            disabled={!submissions.length}
                          >
                            Delete Many
                          </Button>
                          <Button
                            type="primary"
                            className="mr-1"
                            onClick={() => this.setState({ scheduleManyModalVisible: true })}
                            disabled={!submissions.length}
                          >
                            Schedule Many
                          </Button>
                          <Button
                            type="primary"
                            onClick={() => this.setState({ postModalVisible: true })}
                            disabled={!submissions.length}
                          >
                            Post Many
                          </Button>
                        </div>
                        <SubmissionSelectModal
                          visible={this.state.deleteModalVisible}
                          title="Delete"
                          multiple={true}
                          selectAll={true}
                          submissionType={_.get(
                            this.props.submissions[0],
                            'submission.type',
                            SubmissionType.FILE
                          )}
                          onClose={() => this.setState({ deleteModalVisible: false })}
                          onOk={this.deleteSubmissions.bind(this)}
                        />
                        <SubmissionSelectModal
                          visible={this.state.postModalVisible}
                          validOnly={true}
                          title="Post"
                          multiple={true}
                          selectAll={true}
                          submissionType={_.get(
                            this.props.submissions[0],
                            'submission.type',
                            SubmissionType.FILE
                          )}
                          onClose={() => this.setState({ postModalVisible: false })}
                          onOk={this.postSubmissions.bind(this)}
                        >
                          <p>Submissions that have a schedule time will be scheduled instead</p>
                        </SubmissionSelectModal>
                        <SubmissionSelectModal
                          visible={this.state.scheduleManyModalVisible}
                          validOnly={true}
                          title="Schedule"
                          multiple={true}
                          selectAll={true}
                          submissionType={_.get(
                            this.props.submissions[0],
                            'submission.type',
                            SubmissionType.FILE
                          )}
                          onClose={() => this.setState({ scheduleManyModalVisible: false })}
                          onOk={this.scheduleSubmissions.bind(this)}
                          below={
                            <Form layout="vertical">
                              <Form.Item label="Starting At" required>
                                <DatePicker
                                  className="w-full"
                                  defaultValue={this.scheduleManyPeriod.time}
                                  format="YYYY-MM-DD HH:mm"
                                  showTime={{ format: 'HH:mm', use12Hours: true }}
                                  onChange={value =>
                                    (this.scheduleManyPeriod.time = value
                                      ? value.valueOf()
                                      : undefined)
                                  }
                                />
                              </Form.Item>
                              <Form.Item label="Time Between">
                                <Form.Item label="Days">
                                  <InputNumber
                                    defaultValue={this.scheduleManyPeriod.d}
                                    min={0}
                                    onChange={value => (this.scheduleManyPeriod.d = value)}
                                    precision={0}
                                  />
                                </Form.Item>
                                <Form.Item label="Hours">
                                  <InputNumber
                                    defaultValue={this.scheduleManyPeriod.h}
                                    min={0}
                                    onChange={value => (this.scheduleManyPeriod.h = value)}
                                    precision={0}
                                  />
                                </Form.Item>
                                <Form.Item label="Minutes">
                                  <InputNumber
                                    defaultValue={this.scheduleManyPeriod.m}
                                    min={0}
                                    onChange={value => (this.scheduleManyPeriod.m = value)}
                                    precision={0}
                                  />
                                </Form.Item>
                              </Form.Item>
                            </Form>
                          }
                        ></SubmissionSelectModal>
                      </div>
                    }
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
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
        <Dragger {...this.uploadProps} headers={{ Authorization: window.AUTH_ID }}>
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
        <Button onClick={this.showModal.bind(this)} size="large" type="primary" block>
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
