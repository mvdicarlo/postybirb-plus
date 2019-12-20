import React from 'react';
import { inject, observer } from 'mobx-react';

import { headerStore } from '../../stores/header.store';
import { Card, Descriptions } from 'antd';
import { Link } from 'react-router-dom';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { SubmissionStore } from '../../stores/submission.store';

interface Props {
  submissionStore?: SubmissionStore;
}

@inject('submissionStore')
@observer
export default class Home extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    headerStore.updateHeaderState({
      title: 'Home',
      routes: []
    });
  }

  render() {
    return (
      <div>
        <Card className="w-full" title="Submissions" bordered={false}>
          <Card
            className="mb-4"
            type="inner"
            title="File"
            extra={<Link to={`/${SubmissionType.FILE}`}>View</Link>}
          >
            <Card.Meta description="Create and manage multimedia submissions to be sent to multiple websites." />
            {this.props.submissionStore!.fileSubmissions.length ? (
              <Descriptions layout="vertical">
                <Descriptions.Item label="Incomplete">
                  {
                    this.props.submissionStore!.fileSubmissions.filter(
                      s => !s.submission.isPosting && !s.submission.schedule.isScheduled
                    ).length
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Scheduled">
                  {
                    this.props.submissionStore!.fileSubmissions.filter(
                      s => !s.submission.isPosting && s.submission.schedule.isScheduled
                    ).length
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Posting">
                  {
                    this.props.submissionStore!.fileSubmissions.filter(s => s.submission.isPosting)
                      .length
                  }
                </Descriptions.Item>
              </Descriptions>
            ) : null}
          </Card>
          <Card
            type="inner"
            title="Notification"
            extra={<Link to={`/${SubmissionType.NOTIFICATION}`}>View</Link>}
          >
            <Card.Meta description="Create and manage text based submissions used to send blog, journal, or status posts to multiple websites." />
            {this.props.submissionStore!.notificationSubmissions.length ? (
              <Descriptions layout="vertical">
                <Descriptions.Item label="Incomplete">
                  {
                    this.props.submissionStore!.notificationSubmissions.filter(
                      s => !s.submission.isPosting && !s.submission.schedule.isScheduled
                    ).length
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Scheduled">
                  {
                    this.props.submissionStore!.notificationSubmissions.filter(
                      s => !s.submission.isPosting && s.submission.schedule.isScheduled
                    ).length
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Posting">
                  {
                    this.props.submissionStore!.notificationSubmissions.filter(
                      s => s.submission.isPosting
                    ).length
                  }
                </Descriptions.Item>
              </Descriptions>
            ) : null}
          </Card>
        </Card>
      </div>
    );
  }
}
