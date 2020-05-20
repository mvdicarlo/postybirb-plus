import React from 'react';
import * as _ from 'lodash';
import SubmissionLogs from './SubmissionLogs';
import { EditableSubmissions } from './editable-submissions/EditableSubmissions';
import { headerStore } from '../../stores/header.store';
import { SubmissionStore } from '../../stores/submission.store';
import { inject, observer } from 'mobx-react';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { Match, Location } from 'react-router-dom';
import { Tabs, Badge } from 'antd';
import ScheduledSubmissions from './scheduled-submissions/ScheduledSubmissions';
import { uiStore } from '../../stores/ui.store';
import SubmissionQueue from './SubmissionQueue';

interface Props {
  submissionStore?: SubmissionStore;
  match: Match;
  location: Location;
  history: any;
}

@inject('submissionStore')
@observer
export default class SubmissionView extends React.Component<Props> {
  type: SubmissionType = SubmissionType.FILE;
  defaultKey: string = 'submissions';

  constructor(props: Props) {
    super(props);
    uiStore.setActiveNav('update'); // force an update
    switch (props.match.path.split('/').pop()) {
      case SubmissionType.FILE:
        this.type = SubmissionType.FILE;
        break;
      case SubmissionType.NOTIFICATION:
        this.type = SubmissionType.NOTIFICATION;
        break;
    }

    // Don't like doing it like this, but router is being weird.
    // Will need to change if hash routing is ever changed.
    const hashPart = location.hash.split('/').pop(); // eslint-disable-line no-restricted-globals
    if (hashPart === this.type) {
      this.defaultKey = 'submissions';
    } else {
      this.defaultKey = hashPart || 'submissions';
    }

    headerStore.updateHeaderState({
      title: 'Submissions',
      routes: [
        {
          path: `/${this.type}`,
          breadcrumbName: `${_.capitalize(this.type)} Submissions`
        }
      ]
    });
  }

  render() {
    const submissions =
      this.type === SubmissionType.FILE
        ? this.props.submissionStore!.fileSubmissions
        : this.props.submissionStore!.notificationSubmissions;

    const editableSubmissions = submissions.filter(
      s => !s.submission.isPosting && !s.submission.isQueued && !s.submission.schedule.isScheduled
    );

    const scheduledSubmissions = submissions.filter(
      s => !s.submission.isPosting && !s.submission.isQueued && s.submission.schedule.isScheduled
    );

    const queuedSubmissions = submissions.filter(
      s => s.submission.isPosting || s.submission.isQueued
    );

    return (
      <Tabs
        className="overflow-y-auto h-full bg-inherit"
        style={{ overflowY: 'auto' }}
        tabBarStyle={{ zIndex: 10, backgroundColor: 'inherit', position: 'sticky', top: 0 }}
        defaultActiveKey={this.defaultKey}
        onTabClick={(key: string) => {
          this.props.history.replace(`/${this.type}/${key}`);
        }}
      >
        <Tabs.TabPane
          tab={
            <div>
              <span className="mr-1">Submissions</span>
              <Badge count={editableSubmissions.length} />
            </div>
          }
          key="submissions"
        >
          <div className="submission-view">
            <EditableSubmissions
              isLoading={this.props.submissionStore!.isLoading}
              submissions={editableSubmissions}
              type={this.type}
            />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={
            <div>
              <span className="mr-1">Scheduled</span>
              <Badge count={scheduledSubmissions.length} />
            </div>
          }
          key="scheduled"
        >
          <div className="scheduled-view">
            <ScheduledSubmissions submissions={scheduledSubmissions} />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={
            <div>
              <span className="mr-1">Posting</span>
              <Badge count={queuedSubmissions.length} />
            </div>
          }
          key="posting"
        >
          <SubmissionQueue type={this.type} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Logs" key="logs">
          <SubmissionLogs type={this.type} />
        </Tabs.TabPane>
      </Tabs>
    );
  }
}
