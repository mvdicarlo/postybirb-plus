import React from 'react';
import SubmissionService from '../../../services/submission.service';
import SubmissionUtil from '../../../utils/submission.util';
import moment from 'moment';
import { FileSubmission } from 'postybirb-commons';
import { Link } from 'react-router-dom';
import { SubmissionType } from 'postybirb-commons';
import { List, Avatar, Icon, Popconfirm, Typography, message, Modal, DatePicker } from 'antd';
import PostService from '../../../services/post.service';
import { Submission } from 'postybirb-commons';
import { SubmissionPackage } from 'postybirb-commons';

interface ListItemProps {
  item: SubmissionPackage<Submission>;
}

interface ListItemState {
  showScheduler: boolean;
  postAt: number | undefined;
}

export class ScheduledSubmissionListItem extends React.Component<ListItemProps, ListItemState> {
  state: any = {
    showScheduler: false,
    postAt: undefined
  };

  hideScheduler() {
    this.setState({ showScheduler: false, postAt: undefined });
  }

  handleScheduleUpdate() {
    if (this.state.postAt) {
      SubmissionService.setPostAt(this.props.item.submission._id, this.state.postAt);
    }
    this.hideScheduler();
  }

  postNow() {
    PostService.queue(this.props.item.submission._id)
      .then(() => {
        message.success('Submission queued.');
      })
      .catch(() => {
        message.error('Failed to queue submission.');
      });
  }
  
  render() {
    const { item } = this.props;
    return (
      <List.Item
        actions={[
          <span className="text-link" key="schedule-post-now" onClick={this.postNow.bind(this)}>
            Post Now
          </span>,
          <Link to={`/edit/submission/${item.submission.type}/${item.submission._id}`}>
            <span key="schedule-edit">Edit</span>
          </Link>,
          <span
            className="text-link"
            key="schedule-unschedule"
            onClick={() => SubmissionService.schedule(item.submission._id, false)}
          >
            Unschedule
          </span>,
          <Popconfirm
            cancelText="No"
            okText="Yes"
            title="Are you sure you want to delete? This action cannot be undone."
            onConfirm={() => SubmissionService.deleteSubmission(item.submission._id)}
          >
            <Typography.Text type="danger">Delete</Typography.Text>
          </Popconfirm>
        ]}
      >
        <List.Item.Meta
          avatar={
            <span>
              {item.submission.type === SubmissionType.FILE ? (
                <Avatar src={(item.submission as FileSubmission).primary.preview} shape="square" />
              ) : (
                <Avatar icon="notification" shape="square" />
              )}
            </span>
          }
          title={SubmissionUtil.getSubmissionTitle(item)}
          description={
            <span>
              <Icon type="calendar" />
              <span className="mx-1">
                {new Date(item.submission.schedule.postAt!).toLocaleString()}
              </span>
              <span className="text-link">
                <Icon onClick={() => this.setState({ showScheduler: true })} type="edit" />
              </span>
            </span>
          }
        />
        <Modal
          title="Set Schedule"
          visible={this.state.showScheduler}
          onCancel={this.hideScheduler.bind(this)}
          onOk={this.handleScheduleUpdate.bind(this)}
          okButtonProps={{ disabled: !this.state.postAt }}
          destroyOnClose={true}
        >
          <DatePicker
            className="w-full"
            defaultValue={moment(this.props.item.submission.schedule.postAt)}
            format="YYYY-MM-DD HH:mm"
            showTime={{ format: 'HH:mm', use12Hours: true }}
            placeholder="Unscheduled"
            onChange={value => this.setState({ postAt: value ? value.valueOf() : undefined })}
          />
        </Modal>
      </List.Item>
    );
  }
}
