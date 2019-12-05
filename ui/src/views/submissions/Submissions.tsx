import React from 'react';
import { Link } from 'react-router-dom';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import SubmissionService from '../../services/submission.service';
import { SubmissionPackage } from '../../../../electron-app/src/submission/interfaces/submission-package.interface';
import SubmissionUtil from '../../utils/submission.util';
import _ from 'lodash';
import { Problems } from '../../../../electron-app/src/submission/validator/interfaces/problems.interface';
import { loginStatusStore } from '../../stores/login-status.store';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';

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
  message
} from 'antd';

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
      SubmissionUtil.getFileSubmissionTitle(s).toLowerCase().includes(this.state.search)
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
    previewVisible: false
  };

  handleCancel = () => this.setState({ previewVisible: false });
  handleShow = () => this.setState({ previewVisible: true });

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
            className={`text-link ${problemCount > 0 ? 'text-disabled' : ''}`}
            key="submission-post"
          >
            Post
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
            <div className="cursor-zoom-in" onClick={this.handleShow}>
              <Avatar src={item.submission.primary.preview} shape="square" />
            </div>
          }
          title={SubmissionUtil.getFileSubmissionTitle(item)}
          description={`Created - ${new Date(item.submission.created).toLocaleString()}`}
        ></List.Item.Meta>
        <Modal
          visible={this.state.previewVisible}
          footer={null}
          onCancel={this.handleCancel}
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
