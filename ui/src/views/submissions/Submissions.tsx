import React from 'react';
import SubmissionService from '../../services/submission.service';
import SubmissionUtil from '../../utils/submission.util';
import _ from 'lodash';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Link } from 'react-router-dom';
import { Problems } from '../../../../electron-app/src/submission/validator/interfaces/problems.interface';
import { SubmissionPackage } from '../../../../electron-app/src/submission/interfaces/submission-package.interface';
import { loginStatusStore } from '../../stores/login-status.store';
import moment from 'moment';
import SubmissionSelectModal from './submission-select/SubmissionSelectModal';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import PostService from '../../services/post.service';
import {
  Avatar,
  Button,
  DatePicker,
  Icon,
  Input,
  List,
  Modal,
  Popconfirm,
  Tooltip,
  Tree,
  Typography,
  message,
  Form,
  InputNumber,
  Alert
} from 'antd';
import { WebsiteRegistry } from '../../website-components/website-registry';

interface Props {
  submissions: SubmissionPackage<any>[];
  isLoading: boolean;
}

interface State {
  search: string;
  deleteModalVisible: boolean;
  postModalVisible: boolean;
  scheduleManyModalVisible: boolean;
}

export class Submissions extends React.Component<Props, State> {
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

  render() {
    const submissions = this.props.submissions.filter(s =>
      SubmissionUtil.getSubmissionTitle(s)
        .toLowerCase()
        .includes(this.state.search)
    );
    return (
      <div>
        <div className="submission-list">
          <List
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
                  <p>Submissions that have a schedule time will be scheduled</p>
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
                >
                  <Form layout="vertical">
                    <Form.Item label="Starting At" required>
                      <DatePicker
                        className="w-full"
                        defaultValue={this.scheduleManyPeriod.time}
                        format="YYYY-MM-DD HH:mm"
                        showTime={{ format: 'HH:mm', use12Hours: true }}
                        onChange={value =>
                          (this.scheduleManyPeriod.time = value ? value.valueOf() : undefined)
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
                </SubmissionSelectModal>
              </div>
            }
            footer={this.props.children}
            bordered
            itemLayout="vertical"
            loading={this.props.isLoading}
            dataSource={submissions}
            renderItem={(item: SubmissionPackage<Submission>) => <ListItem item={item} />}
          />
        </div>
      </div>
    );
  }
}

interface ListItemProps {
  item: SubmissionPackage<Submission>;
}

interface ListItemState {
  previewVisible: boolean;
  showScheduler: boolean;
  disableActions: boolean;
}

class ListItem extends React.Component<ListItemProps, ListItemState> {
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
            type="warning"
            message="Incompatible Websites"
            description={
              <div>
                <div>
                  The following website(s) do not support additional files:{' '}
                  {unsupportedWebsites.join()}
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
      <List.Item
        className={hasFailure ? 'bg-red-200' : ''}
        extra={
          item.submission.type === SubmissionType.FILE ? this.unsupportedAdditionalWebsites() : null
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
              problemCount > 0 || !item.submission.schedule.postAt || this.state.disableActions
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
          title={SubmissionUtil.getSubmissionTitle(item)}
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
              style={{ width: '100%' }}
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
              this.props.item.submission.schedule.postAt ? moment(this.state.postAt) : undefined
            }
            format="YYYY-MM-DD HH:mm:ss"
            showTime={{ format: 'HH:mm:ss', use12Hours: true }}
            placeholder="Unscheduled"
            onChange={value => (this.postAt = value ? value.valueOf() : undefined)}
          />
        </Modal>
      </List.Item>
    );
  }
}

interface ProblemTreeProps {
  problems: Problems;
}

const IssueState: React.FC<{ problems: Problems; problemCount: number }> = props => {
  return props.problemCount ? (
    <Typography.Text type="danger">
      <Tooltip
        overlayStyle={{ maxWidth: 'unset' }}
        title={<div className="bg-red-100">{<ProblemTree problems={props.problems} />}</div>}
      >
        <Icon type="warning" />
        <span className="ml-2">{props.problemCount}</span>
      </Tooltip>
    </Typography.Text>
  ) : (
    <span className="text-success">
      <Icon type="check-circle" />
      <span className="ml-2">Ready</span>
    </span>
  );
};

class ProblemTree extends React.Component<ProblemTreeProps> {
  createProblemNode = (problem: string): any => {
    return <Tree.TreeNode title={problem} />;
  };

  createAliasNode = (problemObj: any): any => {
    const children = problemObj.problems.map(this.createProblemNode);
    return (
      <Tree.TreeNode
        title={
          <span className="capitalize">
            {loginStatusStore.getAliasForAccountId(problemObj.accountId)}
          </span>
        }
      >
        {children}
      </Tree.TreeNode>
    );
  };

  createWebsiteTree = (website: string, arr: any[]): any => {
    if (website === 'default') {
      return (
        <Tree.TreeNode title="Default" key="default">
          {arr
            .flatMap(p => p.problems)
            .map(p => (
              <Tree.TreeNode title={p} />
            ))}
        </Tree.TreeNode>
      );
    } else {
      const children = arr.map(this.createAliasNode);
      return (
        <Tree.TreeNode title={<span className="capitalize">{website}</span>} key={website}>
          {children}
        </Tree.TreeNode>
      );
    }
  };

  filterEmptyTrees(problems: Problems): Problems {
    const filteredProblems: Problems = {};
    Object.keys(problems).forEach(accountId => {
      if (problems[accountId].problems.length) {
        filteredProblems[accountId] = problems[accountId];
      }
    });

    return filteredProblems;
  }

  render() {
    const problems = this.filterEmptyTrees(this.props.problems);
    const group = _.groupBy(problems, 'website');
    const websiteNodes = Object.entries(group).map(([key, value]) =>
      this.createWebsiteTree(key, value)
    );

    return <Tree defaultExpandAll>{websiteNodes}</Tree>;
  }
}
