import React from 'react';
import { Link } from 'react-router-dom';
import { SubmissionStore } from '../../stores/file-submission.store';
import { inject, observer } from 'mobx-react';
import { List, Avatar, Popconfirm, Modal, Input } from 'antd';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/file-submission.interface';
import SubmissionService from '../../services/submission.service';

interface Props {
  submissionStore?: SubmissionStore;
}

interface State {
  search: string;
}

interface ListItemProps {
  item: FileSubmission;
}

class ListItem extends React.Component<ListItemProps, any> {
  state: any = {
    previewVisible: false
  };

  handleCancel = () => this.setState({ previewVisible: false });
  handleShow = () => this.setState({ previewVisible: true });

  render() {
    const { item } = this.props;
    return (
      <List.Item
        actions={[
          <Link to={`/submission/${item.id}`}>
            <a key="submission-edit">Edit</a>
          </Link>,
          <Popconfirm
            cancelText="No"
            okText="Yes"
            title="Are you sure you want to delete? This action cannot be undone."
            onConfirm={() => SubmissionService.deleteFileSubmission(item.id)}
          >
            <a key="submission-delete">Delete</a>
          </Popconfirm>
        ]}
      >
        <List.Item.Meta
          avatar={
            <div className="cursor-zoom-in" onClick={this.handleShow}>
              <Avatar src={item.primary.preview} shape="square" />
            </div>
          }
          title={item.title}
          description={`Created - ${new Date(item.created).toLocaleString()}`}
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
            src={item.primary.type === 'IMAGE' ? item.primary.location : item.primary.preview}
          />
        </Modal>
      </List.Item>
    );
  }
}

@inject('submissionStore')
@observer
export class Submissions extends React.Component<any | Props, State> {
  state: State = {
    search: ''
  };

  handleSearch = search => this.setState({ search: search.toLowerCase() });

  render() {
    const submissions: FileSubmission[] = this.props.submissionStore.all.filter(
      (s: FileSubmission) =>
        s.title.toLowerCase().includes(this.state.search)
    );
    return (
      <div>
        <Input.Search onSearch={this.handleSearch} style={{ width: 200 }} />
        <div className="submission-list">
          <List
            loading={this.props.submissionStore.isLoading}
            dataSource={submissions}
            renderItem={(item: FileSubmission) => (
              <ListItem item={item}></ListItem>
            )}
          ></List>
        </div>
      </div>
    );
  }
}
