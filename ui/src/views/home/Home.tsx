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
              <Descriptions className="mt-2" colon={false} layout="vertical">
                <Descriptions.Item
                  label={<Link to={`/${SubmissionType.FILE}/submissions`}>Incomplete</Link>}
                >
                  {
                    this.props.submissionStore!.fileSubmissions.filter(
                      s =>
                        !s.submission.isPosting &&
                        !s.submission.isQueued &&
                        !s.submission.schedule.isScheduled
                    ).length
                  }
                </Descriptions.Item>
                <Descriptions.Item
                  label={<Link to={`/${SubmissionType.FILE}/scheduled`}>Scheduled</Link>}
                >
                  {
                    this.props.submissionStore!.fileSubmissions.filter(
                      s =>
                        !s.submission.isPosting &&
                        !s.submission.isQueued &&
                        s.submission.schedule.isScheduled
                    ).length
                  }
                </Descriptions.Item>
                <Descriptions.Item
                  label={<Link to={`/${SubmissionType.FILE}/posting`}>Posting</Link>}
                >
                  {
                    this.props.submissionStore!.fileSubmissions.filter(
                      s => s.submission.isPosting || s.submission.isQueued
                    ).length
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
              <Descriptions className="mt-2" colon={false} layout="vertical">
                <Descriptions.Item
                  label={<Link to={`/${SubmissionType.NOTIFICATION}/submissions`}>Incomplete</Link>}
                >
                  {
                    this.props.submissionStore!.notificationSubmissions.filter(
                      s =>
                        !s.submission.isPosting &&
                        !s.submission.isQueued &&
                        !s.submission.schedule.isScheduled
                    ).length
                  }
                </Descriptions.Item>
                <Descriptions.Item
                  label={<Link to={`/${SubmissionType.NOTIFICATION}/scheduled`}>Scheduled</Link>}
                >
                  {
                    this.props.submissionStore!.notificationSubmissions.filter(
                      s =>
                        !s.submission.isPosting &&
                        !s.submission.isQueued &&
                        s.submission.schedule.isScheduled
                    ).length
                  }
                </Descriptions.Item>
                <Descriptions.Item
                  label={<Link to={`/${SubmissionType.NOTIFICATION}/posting`}>Posting</Link>}
                >
                  {
                    this.props.submissionStore!.notificationSubmissions.filter(
                      s => s.submission.isPosting || s.submission.isQueued
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
