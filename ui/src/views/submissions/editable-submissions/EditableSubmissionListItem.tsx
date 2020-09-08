import {
  Alert,
  Avatar,
  DatePicker,
  Icon,
  List,
  message,
  Modal,
  Popconfirm,
  Typography
} from 'antd';
import moment from 'moment';
import React from 'react';
import { Draggable, DraggableProvided } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import { FileSubmission } from '../../../../../electron-app/src/server/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPackage } from '../../../../../electron-app/src/server/submission/interfaces/submission-package.interface';
import { Submission } from '../../../../../electron-app/src/server/submission/interfaces/submission.interface';
import { Problems } from '../../../../../electron-app/src/server/submission/validator/interfaces/problems.interface';
import PostService from '../../../services/post.service';
import SubmissionService from '../../../services/submission.service';
import { SubmissionType } from 'postybirb-commons';
import SubmissionUtil from '../../../utils/submission.util';
import { WebsiteRegistry } from '../../../websites/website-registry';
import { IssueState } from './IssueState';

interface ListItemProps {
  item: SubmissionPackage<Submission>;
}

interface ListItemState {
  previewVisible: boolean;
  showScheduler: boolean;
  disableActions: boolean;
}

export class EditableSubmissionListItem extends React.Component<ListItemProps, ListItemState> {
  state: any = {
    previewVisible: false,
    showScheduler: false,
    disableActions: false
  };

  disableActions: boolean = false;
  postAt: number | undefined = undefined;

  hidePreview() {
    this.setState({ previewVisible: false });
  }

  showPreview() {
    this.setState({ previewVisible: true });
  }

  showScheduler() {
    this.setState({ showScheduler: true });
  }

  hideScheduler() {
    this.postAt = undefined;
    this.setState({ showScheduler: false });
  }

  handleScheduleUpdate() {
    if (this.disableActions) return;
    this.disableActions = true;
    this.setState({ disableActions: true });
    SubmissionService.setPostAt(this.props.item.submission._id, this.postAt).finally(() => {
      this.setState({ disableActions: false });
      this.disableActions = false;
    });
    this.hideScheduler();
  }

  onDuplicate() {
    if (this.disableActions) return;
    this.disableActions = true;
    this.setState({ disableActions: true });
    SubmissionService.duplicate(this.props.item.submission._id)
      .then(() => {
        message.success('Submission duplicated.');
      })
      .catch(() => {
        message.error('PostyBirb was unable to duplicate the submission.');
      })
      .finally(() => {
        this.setState({ disableActions: false });
        this.disableActions = false;
      });
  }

  onPost() {
    if (this.disableActions) return;
    this.disableActions = true;
    this.setState({ disableActions: true });
    PostService.queue(this.props.item.submission._id)
      .then(() => {
        message.success('Submission queued.');
      })
      .catch(() => {
        message.error('Failed to queue submission.');
      })
      .finally(() => {
        this.setState({ disableActions: false });
        this.disableActions = false;
      });
  }

  onSchedule() {
    if (this.disableActions) return;
    this.disableActions = true;
    this.setState({ disableActions: true });
    SubmissionService.schedule(this.props.item.submission._id, true)
      .then(() => {
        message.success('Submission scheduled.');
      })
      .catch(() => {
        message.error('Failed to schedule submission.');
      })
      .finally(() => {
        this.setState({ disableActions: false });
        this.disableActions = false;
      });
  }

  splitAdditionalFilesIntoNewSubmissions() {
    SubmissionService.splitAdditionalFilesIntoNewSubmissions(this.props.item.submission._id)
      .then(() => {
        message.success('Submission successfully split.');
      })
      .catch(() => {
        message.error('Failed to split submission.');
      });
  }

  unsupportedAdditionalWebsites() {
    const { item } = this.props;
    if ((item.submission as FileSubmission).additional!.length) {
      const unsupportedWebsites = Object.values(item.parts)
        .filter(p => !p.isDefault)
        .filter(p => p.postStatus !== 'SUCCESS')
        .filter(p => !WebsiteRegistry.websites[p.website].supportsAdditionalFiles)
        .map(p => WebsiteRegistry.websites[p.website].name);
      if (unsupportedWebsites.length) {
        return (
          <Alert
            type="error"
            message=""
            description={
              <div>
                <div>
                  The following website(s) do not support additional files:{' '}
                  {unsupportedWebsites.join(', ')}
                </div>

                <span
                  className="text-link"
                  onClick={this.splitAdditionalFilesIntoNewSubmissions.bind(this)}
                >
                  Create submissions for unsupported websites
                </span>
              </div>
            }
          />
        );
      }
    }
    return null;
  }
  render() {
    const { item } = this.props;
    const problems: Problems = item.problems;
    const problemCount: number = SubmissionUtil.getProblemCount(problems);
    const hasFailure = !!Object.values(item.parts).find(p => p.postStatus === 'FAILED');
    return (
      <Draggable
        key={item.submission._id}
        draggableId={item.submission._id}
        index={item.submission.order}
      >
        {(provided: DraggableProvided) => (
          <div
            className="ant-list-item ant-list-split"
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
          >
            <List.Item
              className={`p-0 ${hasFailure ? 'error' : ''}`}
              extra={
                item.submission.type === SubmissionType.FILE
                  ? this.unsupportedAdditionalWebsites()
                  : null
              }
              actions={[
                <span
                  className={`text-link ${
                    problemCount > 0 || this.state.disableActions ? 'disabled' : ''
                  }`}
                  key="submission-post"
                  onClick={this.onPost.bind(this)}
                >
                  Post
                </span>,
                <span
                  className={`text-link ${
                    problemCount > 0 ||
                    !item.submission.schedule.postAt ||
                    this.state.disableActions
                      ? 'disabled'
                      : ''
                  }`}
                  key="submission-schedule"
                  onClick={this.onSchedule.bind(this)}
                >
                  Schedule
                </span>,
                <Link
                  className={`${this.state.disableActions ? 'disabled' : ''}`}
                  to={`/edit/submission/${item.submission.type}/${item.submission._id}`}
                >
                  <span key="submission-edit">Edit</span>
                </Link>,
                <span
                  className={`text-link ${this.state.disableActions ? 'disabled' : ''}`}
                  key="submission-duplicate"
                  onClick={this.onDuplicate.bind(this)}
                >
                  Duplicate
                </span>,
                <Popconfirm
                  disabled={this.state.disableActions}
                  cancelText="No"
                  okText="Yes"
                  title="Are you sure you want to delete? This action cannot be undone."
                  onConfirm={() => SubmissionService.deleteSubmission(item.submission._id)}
                >
                  <Typography.Text
                    className={`${this.state.disableActions ? 'disabled' : ''}`}
                    type="danger"
                  >
                    Delete
                  </Typography.Text>
                </Popconfirm>,
                <IssueState problems={problems} problemCount={problemCount} />
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div>
                    {item.submission.type === SubmissionType.FILE ? (
                      <div className="cursor-zoom-in" onClick={this.showPreview.bind(this)}>
                        <Avatar
                          src={(item.submission as FileSubmission).primary.preview}
                          shape="square"
                        />
                      </div>
                    ) : (
                      <Avatar icon="notification" shape="square" />
                    )}
                  </div>
                }
                title={
                  <span className={hasFailure ? 'text-danger' : ''}>{`${
                    hasFailure ? '[FAILED] ' : ''
                  }${SubmissionUtil.getSubmissionTitle(item)}`}</span>
                }
                description={
                  <div>
                    <span>
                      <Icon type="calendar" />
                    </span>
                    <span className="mx-1">
                      {item.submission.schedule.postAt
                        ? new Date(item.submission.schedule.postAt).toLocaleString()
                        : 'Unscheduled'}
                    </span>
                    <span className="text-link">
                      <Icon onClick={this.showScheduler.bind(this)} type="edit" />
                    </span>
                  </div>
                }
              ></List.Item.Meta>
              {item.submission.type === SubmissionType.FILE ? (
                <Modal
                  visible={this.state.previewVisible}
                  footer={null}
                  onCancel={this.hidePreview.bind(this)}
                  destroyOnClose={true}
                >
                  <img
                    alt="preview"
                    className="w-full"
                    src={
                      (item.submission as FileSubmission).primary.type === 'IMAGE'
                        ? (item.submission as FileSubmission).primary.location
                        : (item.submission as FileSubmission).primary.preview
                    }
                  />
                </Modal>
              ) : null}

              <Modal
                title="Set Schedule"
                visible={this.state.showScheduler}
                onCancel={this.hideScheduler.bind(this)}
                onOk={this.handleScheduleUpdate.bind(this)}
                destroyOnClose={true}
              >
                <DatePicker
                  className="w-full"
                  defaultValue={
                    this.props.item.submission.schedule.postAt
                      ? moment(this.state.postAt)
                      : undefined
                  }
                  format="YYYY-MM-DD HH:mm:ss"
                  showTime={{ format: 'HH:mm:ss', use12Hours: true }}
                  placeholder="Unscheduled"
                  onChange={value => (this.postAt = value ? value.valueOf() : undefined)}
                />
              </Modal>
            </List.Item>
            {provided.placeholder}
          </div>
        )}
      </Draggable>
    );
  }
}
