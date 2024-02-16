import React from 'react';
import SubmissionService from '../../../services/submission.service';
import SubmissionUtil from '../../../utils/submission.util';
import moment from 'moment';
import { Submission } from 'postybirb-commons';
import { SubmissionPackage } from 'postybirb-commons';
import { Calendar, Button, List, Badge, message, Popconfirm } from 'antd';
import { ScheduledSubmissionListItem } from './ScheduledSubmissionListItem';

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
          <li key={s.submission._id}>
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
                  <span className="block">
                    {new Date(s.submission.schedule.postAt!).toLocaleTimeString()}
                  </span>
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
      this.props.submissions.map(s => SubmissionService.schedule(s.submission._id, false))
    ).finally(() => message.success('Submissions unscheduled.'));
  }

  render() {
    return (
      <div>
        <div className="submission-list">
          <List
            header={
              <div>
                <Popconfirm
                  title="Are you sure to unschedule all items?"
                  onConfirm={this.unscheduleAll.bind(this)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="danger"
                    block
                    disabled={!this.props.submissions.length}
                  >
                    Unschedule All
                  </Button>
                </Popconfirm>
              </div>
            }
            dataSource={this.props.submissions.sort(
              (a, b) => a.submission.schedule.postAt! - b.submission.schedule.postAt!
            )}
            renderItem={(item: SubmissionPackage<Submission>) => (
              <ScheduledSubmissionListItem item={item} />
            )}
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
