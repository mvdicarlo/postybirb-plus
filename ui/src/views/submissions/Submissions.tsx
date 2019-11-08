import React from 'react';
import { Link } from 'react-router-dom';
import { SubmissionStore } from '../../stores/submission.store';
import { inject, observer } from 'mobx-react';
import { List, Avatar, Popconfirm } from 'antd';
import { SubmissionDTO } from '../../interfaces/submission.interface';
import SubmissionService from '../../services/submission.service';

interface Props {
  submissionStore?: SubmissionStore;
}

const ListItem: React.SFC<SubmissionDTO> = (props: SubmissionDTO) => {
  return (
    <List.Item
      actions={[
        <Link to={`/submission/${props.id}`}>
          <a key="submission-edit">Edit</a>
        </Link>,
        <Popconfirm
          cancelText="No"
          okText="Yes"
          title="Are you sure you want to delete? This action cannot be undone."
          onConfirm={() => SubmissionService.deleteSubmission(props.id)}
        >
          <a key="submission-delete">Delete</a>
        </Popconfirm>
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar src={props.fileLocations.thumbnail} shape="square"/>}
        title={props.title}
        description={`Created - ${new Date(props.created).toLocaleString()}`}
      ></List.Item.Meta>
    </List.Item>
  );
};

@inject('submissionStore')
@observer
export class Submissions extends React.Component<any | Props> {
  render() {
    return (
      <div className="submission-list">
        <List
          loading={this.props.submissionStore.isLoading}
          dataSource={this.props.submissionStore.all}
          renderItem={ListItem}
        ></List>
      </div>
    );
  }
}
