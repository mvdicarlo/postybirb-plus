import React from 'react';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { SubmissionLog } from '../../../../electron-app/src/server/submission/log/interfaces/submission-log.interface';
import SubmissionLogService from '../../services/submission-log.service';
import { saveAs } from 'file-saver';
import { List, Button, Icon, Typography, message, Modal } from 'antd';
import SubmissionService from '../../services/submission.service';

interface Props {
  type: SubmissionType;
}

interface State {
  displayLog: boolean;
  logs: SubmissionLog[];
  loading: boolean;
  viewLog?: SubmissionLog;
}

export default class SubmissionLogs extends React.Component<Props, State> {
  state: State = {
    logs: [],
    loading: false,
    displayLog: false,
    viewLog: undefined
  };

  constructor(props: Props) {
    super(props);
    this.loadLogs();
  }

  loadLogs() {
    this.setState({ loading: true });
    SubmissionLogService.getLogs(this.props.type).then(logs =>
      this.setState({ logs, loading: false })
    );
  }

  saveLog(log: SubmissionLog) {
    const blob: Blob = new Blob([JSON.stringify(log, null, 1)], {
      type: 'application/json'
    });
    saveAs(blob, `${log.created}_${log.submission.title}.log`);
  }

  viewLog(log: SubmissionLog) {
    this.setState({ viewLog: log, displayLog: true });
  }

  recreateSubmission(log: SubmissionLog) {
    SubmissionService.recreateSubmissionFromLog(log)
      .then(() => {
        message.success('Submission recreated.');
      })
      .catch(() => {
        message.error('Unable to recreate submission.');
      });
  }

  render() {
    return (
      <div>
        <List
          itemLayout="vertical"
          loading={this.state.loading}
          dataSource={this.state.logs}
          header={
            <div className="text-right">
              <Button onClick={this.loadLogs.bind(this)} disabled={this.state.loading}>
                <Icon type="redo" />
              </Button>
            </div>
          }
          renderItem={item => (
            <List.Item
              key={item._id}
              actions={[
                <span className="text-link" onClick={() => this.recreateSubmission(item)}>
                  Recreate Submission
                </span>,
                <span className="text-link" onClick={() => this.saveLog(item)}>
                  Download
                </span>,
                <span className="text-link" onClick={() => this.viewLog(item)}>
                  View
                </span>
              ]}
            >
              <List.Item.Meta
                title={item.submission.title}
                description={<div>Posted at {new Date(item.created).toLocaleString()}</div>}
              />
              <div className="flex break-all">
                <div className="flex-1">
                  <Typography.Title level={4}>Successful</Typography.Title>
                  <Typography.Text>
                    <ul className="text-success">
                      {item.parts
                        .filter(p => p.part.postStatus === 'SUCCESS')
                        .sort((a, b) => a.part.website.localeCompare(b.part.website))
                        .map(p => (
                          <li>
                            <span className="mr-1">{p.part.website}</span>
                            {p.part.postedTo ? (
                              <span>
                                [
                                <Typography.Text className="text-xs" copyable>
                                  {p.part.postedTo}
                                </Typography.Text>
                                ]
                              </span>
                            ) : null}
                          </li>
                        ))}
                    </ul>
                  </Typography.Text>
                </div>
                <div className="flex-1">
                  <Typography.Title level={4}>Failed</Typography.Title>
                  <Typography.Text type="danger">
                    <ul>
                      {item.parts
                        .filter(p => p.part.postStatus !== 'SUCCESS')
                        .sort((a, b) => a.part.website.localeCompare(b.part.website))
                        .map(p => (
                          <li>
                            <span className="mr-1">{p.part.website}</span>
                          </li>
                        ))}
                    </ul>
                  </Typography.Text>
                </div>
              </div>
            </List.Item>
          )}
        />
        <Modal
          visible={this.state.displayLog}
          title={this.state.viewLog ? this.state.viewLog.submission.title : ''}
          destroyOnClose={true}
          onCancel={() => this.setState({ displayLog: false, viewLog: undefined })}
          footer={null}
        >
          <code className="block whitespace-pre-wrap overflow-auto" style={{ maxHeight: '50vh' }}>
            {JSON.stringify(this.state.viewLog, null, 1)}
          </code>
        </Modal>
      </div>
    );
  }
}
