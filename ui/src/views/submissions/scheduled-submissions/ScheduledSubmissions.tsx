import React from 'react';
import SubmissionService from '../../../services/submission.service';
import SubmissionUtil from '../../../utils/submission.util';
import moment from 'moment';
import { Submission } from '../../../../../electron-app/src/submission/interfaces/submission.interface';
import { SubmissionPackage } from '../../../../../electron-app/src/submission/interfaces/submission-package.interface';
import {
  Calendar,
  Button,
  List,
  Badge,
  message} from 'antd';
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
            renderItem={(item: SubmissionPackage<Submission>) => <ScheduledSubmissionListItem item={item} />}
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
