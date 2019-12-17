import React from 'react';
import SubmissionService from '../../services/submission.service';
import SubmissionUtil from '../../utils/submission.util';
import moment from 'moment';
import {
  Calendar,
  Button,
  List,
  Avatar,
  Icon,
  Popconfirm,
  Typography,
  Badge,
  message,
  Modal,
  DatePicker
} from 'antd';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Link } from 'react-router-dom';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import { SubmissionPackage } from '../../../../electron-app/src/submission/interfaces/submission-package.interface';
import { SubmissionType } from '../../shared/enums/submission-type.enum';

interface Props {
  submissions: SubmissionPackage<Submission>[];
}

export default class ScheduledSubmissions extends React.Component<Props> {
  getDateData(date: moment.Moment) {
    return this.props.submissions.filter(s => {
      const d = new Date(s.submission.schedule.postAt!);
      return (
        d.getMonth() === date.month() &&
        d.getFullYear() === date.year() &&
        d.getDate() === date.date()
      );
    });
  }

  dateCellRenderer = (date: moment.Moment) => {
    const data = this.getDateData(date);
    return (
      <ul className="calendar-events">
        {data.map(s => (
          <li key={s.submission.id}>
            <Badge
              status="processing"
              text={
                <span
                  className="text-xs"
                  title={`${SubmissionUtil.getSubmissionTitle(s)} [${new Date(
                    s.submission.schedule.postAt!
                  ).toLocaleTimeString()}]`}
                >
                  <span className="mr-1">{SubmissionUtil.getSubmissionTitle(s)}</span>
                  <span>{new Date(s.submission.schedule.postAt!).toLocaleTimeString()}</span>
                </span>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  getMonthData(date: moment.Moment) {
    return this.props.submissions.filter(s => {
      const d = new Date(s.submission.schedule.postAt!);
      return d.getMonth() === date.month() && d.getFullYear() === date.year();
    }).length;
  }

  monthCellRenderer = (date: moment.Moment) => {
    const num = this.getMonthData(date);
    return num ? (
      <div className="text-center text-xl">
        <section>{num}</section>
        <section>Scheduled</section>
      </div>
    ) : null;
  };

  unscheduleAll() {
    Promise.all(
      this.props.submissions.map(s => SubmissionService.schedule(s.submission.id, false))
    ).finally(() => message.success('Submissions unscheduled.'));
  }

  render() {
    return (
      <div>
        <div className="submission-list">
          <List
            header={
              <div>
                <Button
                  type="danger"
                  block
                  disabled={!this.props.submissions.length}
                  onClick={this.unscheduleAll.bind(this)}
                >
                  Unschedule All
                </Button>
              </div>
            }
            dataSource={this.props.submissions}
            renderItem={(item: SubmissionPackage<Submission>) => <ListItem item={item} />}
          />
        </div>

        <div>
          <Calendar
            dateCellRender={this.dateCellRenderer}
            monthCellRender={this.monthCellRenderer}
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
  showScheduler: boolean;
  postAt: number | undefined;
}

class ListItem extends React.Component<ListItemProps, ListItemState> {
  state: any = {
    showScheduler: false,
    postAt: undefined
  };
  
  hideScheduler() {
    this.setState({ showScheduler: false, postAt: undefined });
  }

  handleScheduleUpdate() {
    if (this.state.postAt) {
      SubmissionService.setPostAt(this.props.item.submission.id, this.state.postAt);
    }
    this.hideScheduler();
  }

  render() {
    const { item } = this.props;

    return (
      <List.Item
        actions={[
          <span className="text-link" key="schedule-post-now">
            Post Now
          </span>,
          <Link to={`/edit/submission/${item.submission.id}`}>
            <span key="schedule-edit">Edit</span>
          </Link>,
          <span
            className="text-link"
            key="schedule-unschedule"
            onClick={() => SubmissionService.schedule(item.submission.id, false)}
          >
            Unschedule
          </span>,
          <Popconfirm
            cancelText="No"
            okText="Yes"
            title="Are you sure you want to delete? This action cannot be undone."
            onConfirm={() => SubmissionService.deleteSubmission(item.submission.id)}
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
            showTime={{ format: 'HH:mm' }}
            placeholder="Unscheduled"
            onChange={value => this.setState({ postAt: value ? value.valueOf() : undefined })}
          />
        </Modal>
      </List.Item>
    );
  }
}
