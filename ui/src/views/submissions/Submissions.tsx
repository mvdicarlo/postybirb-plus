import React from 'react';
import { Link } from 'react-router-dom';
import { SubmissionStore } from '../../stores/file-submission.store';
import { inject, observer } from 'mobx-react';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import SubmissionService from '../../services/submission.service';
import { SubmissionPackage } from '../../../../electron-app/src/submission/interfaces/submission-package.interface';
import SubmissionUtil from '../../utils/submission.util';
import { List, Avatar, Popconfirm, Modal, Input, Typography, Button, Badge, Tooltip } from 'antd';

interface Props {
  submissionStore?: SubmissionStore;
}

interface State {
  search: string;
}

@inject('submissionStore')
@observer
export class Submissions extends React.Component<Props, State> {
  state: State = {
    search: ''
  };

  handleSearch = search => this.setState({ search: search.toLowerCase() });

  render() {
    const { submissionStore } = this.props;

    const submissions = submissionStore!.all.filter(s =>
      s.submission.title.toLowerCase().includes(this.state.search)
    );
    return (
      <div>
        <Input.Search onSearch={this.handleSearch} style={{ width: 200 }} />
        <div className="submission-list">
          <List
            itemLayout="vertical"
            loading={submissionStore!.isLoading}
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

  render() {
    const { item } = this.props;
    const problemCount: number = SubmissionUtil.getProblemCount(item);
    const problemTree = null;
    return (
      <List.Item
        className={problemCount > 0 ? 'bg-red-100' : ''}
        actions={[
          <Link to={`/edit/submission/${item.submission.id}`}>
            <Button type="link" key="submission-edit">
              Edit
            </Button>
          </Link>,
          <Popconfirm
            cancelText="No"
            okText="Yes"
            title="Are you sure you want to delete? This action cannot be undone."
            onConfirm={() => SubmissionService.deleteFileSubmission(item.submission.id)}
          >
            <Button type="link" key="submission-delete">
              <Typography.Text type="danger">Delete</Typography.Text>
            </Button>
          </Popconfirm>,
          <Button type="link" key="submission-post" disabled={problemCount > 0}>
            Post
          </Button>
        ]}
        extra={
          problemCount > 0 ? (
            <div>
              <Typography.Text className="align-middle mr-1" type="danger">
                Submission is incomplete
              </Typography.Text>
              <Tooltip title={problemTree}>
                <Badge count={problemCount} />
              </Tooltip>
            </div>
          ) : null
        }
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
