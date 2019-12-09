import React from 'react';
import { Link } from 'react-router-dom';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import SubmissionService from '../../services/submission.service';
import { SubmissionPackage } from '../../../../electron-app/src/submission/interfaces/submission-package.interface';
import SubmissionUtil from '../../utils/submission.util';
import _ from 'lodash';
import { Problems } from '../../../../electron-app/src/submission/validator/interfaces/problems.interface';
import { loginStatusStore } from '../../stores/login-status.store';

import {
  List,
  Avatar,
  Popconfirm,
  Modal,
  Input,
  Typography,
  Tooltip,
  Icon,
  Tree,
  message,
  DatePicker
} from 'antd';
import moment from 'moment';

interface Props {
  submissions: SubmissionPackage<any>[];
  isLoading: boolean;
}

interface State {
  search: string;
}

export class Submissions extends React.Component<Props, State> {
  state: State = {
    search: ''
  };

  handleSearch = ({ target }) => this.setState({ search: target.value.toLowerCase() });

  render() {
    const submissions = this.props.submissions.filter(s =>
      SubmissionUtil.getFileSubmissionTitle(s)
        .toLowerCase()
        .includes(this.state.search)
    );
    return (
      <div>
        <div className="submission-list">
          <List
            header={<Input.Search onChange={this.handleSearch} style={{ width: 200 }} />}
            footer={this.props.children}
            bordered
            itemLayout="vertical"
            loading={this.props.isLoading}
            dataSource={submissions}
            renderItem={(item: SubmissionPackage<FileSubmission>) => (
              <ListItem item={item}></ListItem>
            )}
          ></List>
        </div>
      </div>
    );
  }
}

interface ListItemProps {
  item: SubmissionPackage<FileSubmission>;
}

class ListItem extends React.Component<ListItemProps, any> {
  state: any = {
    previewVisible: false,
    showScheduler: false
  };

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
    SubmissionService.setPostAt(this.props.item.submission.id, this.postAt);
    this.hideScheduler();
  }

  onDuplicate() {
    SubmissionService.duplicate(this.props.item.submission.id)
      .then(() => {
        message.success('Submission duplicated.');
      })
      .catch(() => {
        message.error('PostyBirb was unable to duplicate the submission.');
      });
  }

  render() {
    const { item } = this.props;
    const problems: Problems = JSON.parse(JSON.stringify(item.problems));
    const problemCount: number = SubmissionUtil.getProblemCount(problems);
    return (
      <List.Item
        actions={[
          <span
            className={`text-link ${problemCount > 0 ? 'disabled' : ''}`}
            key="submission-post"
          >
            Post
          </span>,
          <span
            className={`text-link ${
              problemCount > 0 || !item.submission.schedule.postAt ? 'disabled' : ''
            }`}
            key="submission-schedule"
          >
            Schedule
          </span>,
          <Link to={`/edit/submission/${item.submission.id}`}>
            <span key="submission-edit">Edit</span>
          </Link>,
          <span
            className="text-link"
            key="submission-duplicate"
            onClick={this.onDuplicate.bind(this)}
          >
            Duplicate
          </span>,
          <Popconfirm
            cancelText="No"
            okText="Yes"
            title="Are you sure you want to delete? This action cannot be undone."
            onConfirm={() => SubmissionService.deleteFileSubmission(item.submission.id)}
          >
            <Typography.Text type="danger">Delete</Typography.Text>
          </Popconfirm>,
          <IssueState problems={problems} problemCount={problemCount} />
        ]}
      >
        <List.Item.Meta
          avatar={
            <div className="cursor-zoom-in" onClick={this.showPreview.bind(this)}>
              <Avatar src={item.submission.primary.preview} shape="square" />
            </div>
          }
          title={SubmissionUtil.getFileSubmissionTitle(item)}
          description={
            <div>
              <span className="ml-1">
                <Icon type="calendar" />
              </span>
              <span className="ml-1">
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
              item.submission.primary.type === 'IMAGE'
                ? item.submission.primary.location
                : item.submission.primary.preview
            }
          />
        </Modal>

        <Modal
          title="Set Schedule"
          visible={this.state.showScheduler}
          onCancel={this.hideScheduler.bind(this)}
          onOk={this.handleScheduleUpdate.bind(this)}
          destroyOnClose={true}
        >
          <DatePicker
            className="w-full"
            defaultValue={this.props.item.submission.schedule.postAt ? moment(this.state.postAt) : undefined}
            format="YYYY-MM-DD HH:mm"
            showTime={{ format: 'HH:mm' }}
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
    <span className="text-warning">
      <Tooltip
        overlayStyle={{ maxWidth: 'unset' }}
        title={<div className="bg-red-100">{<ProblemTree problems={props.problems} />}</div>}
      >
        <Icon type="warning" />
        <span className="ml-2">{props.problemCount}</span>
      </Tooltip>
    </span>
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
