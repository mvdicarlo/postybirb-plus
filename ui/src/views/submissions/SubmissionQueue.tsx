import React from 'react';
import * as _ from 'lodash';
import { inject, observer } from 'mobx-react';
import { PostStatusStore } from '../../stores/post-status.store';
import { List, Avatar, message, Button, Typography, Card, Empty, Descriptions, Badge } from 'antd';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { submissionStore } from '../../stores/submission.store';
import { PostInfoStatus } from '../../../../electron-app/src/submission/post/interfaces/post-status.interface';
import PostService from '../../services/post.service';
import { Link } from 'react-router-dom';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import { WebsiteRegistry } from '../../website-components/website-registry';
import { loginStatusStore } from '../../stores/login-status.store';

interface Props {
  postStatusStore?: PostStatusStore;
  type: SubmissionType;
}

@inject('postStatusStore')
@observer
export default class SubmissionQueue extends React.Component<Props> {
  cancelSubmission(id: string) {
    PostService.cancel(id)
      .then(() => {
        message.success('Submission cancelled.');
      })
      .catch(() => {
        message.info('Failed to cancel submission.'); // should never happen
      });
  }

  cancelAllQueuedSubmissions() {
    PostService.cancelAll(this.props.type).finally(() => {
      message.success('Submissions cancelled.');
    });
  }

  getStatusDescriptionSection() {
    const posting = this.props.postStatusStore!.posting.filter(
      p => p.submission.type === this.props.type
    )[0];
    const groups = _.groupBy(posting.statuses, 'website');

    return (
      <Descriptions bordered className="mt-2" size="middle">
        {Object.entries(groups).map(([key, value]) => (
          <Descriptions.Item key={key} label={WebsiteRegistry.websites[key].name} span={3}>
            {value.map(status => (
              <AccountPostStatus {...status} />
            ))}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  }

  render() {
    const queued = this.props.postStatusStore!.queued.filter(q => q.type === this.props.type);
    const posting = this.props.postStatusStore!.posting.filter(
      p => p.submission.type === this.props.type
    )[0];
    return (
      <div>
        <div className="mb-3">
          {posting ? (
            <Card
              title="Posting"
              bordered={false}
              className="w-full"
              extra={
                <span
                  className="text-link"
                  onClick={() => this.cancelSubmission(posting.submission._id)}
                >
                  Cancel
                </span>
              }
            >
              <Card.Meta
                title={submissionStore.getSubmissionTitle(posting.submission._id)}
                avatar={
                  <span>
                    {posting.submission.type === SubmissionType.FILE ? (
                      <Avatar
                        src={(posting.submission as FileSubmission).primary.preview}
                        shape="square"
                      />
                    ) : (
                      <Avatar icon="notification" shape="square" />
                    )}
                  </span>
                }
              />
              {this.getStatusDescriptionSection()}
            </Card>
          ) : (
            <Empty description="No submission is currently posting" />
          )}
        </div>
        <div>
          <List
            header={
              <div>
                <Typography.Title level={4}>Queued</Typography.Title>
                <Button
                  disabled={!queued.length}
                  block
                  type="danger"
                  onClick={this.cancelAllQueuedSubmissions.bind(this)}
                >
                  Cancel All
                </Button>
              </div>
            }
            dataSource={queued}
            renderItem={item => (
              <List.Item
                actions={[
                  <Link to={`/edit/submission/${item._id}`}>
                    <span key="schedule-edit">Edit</span>
                  </Link>,
                  <span
                    className="text-warning"
                    key="queued-cancel"
                    onClick={() => this.cancelSubmission(item._id)}
                  >
                    Cancel
                  </span>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <span>
                      {item.type === SubmissionType.FILE ? (
                        <Avatar src={(item as FileSubmission).primary.preview} shape="square" />
                      ) : (
                        <Avatar icon="notification" shape="square" />
                      )}
                    </span>
                  }
                  title={submissionStore.getSubmissionTitle(item._id)}
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    );
  }
}

interface PostingInformationProps {
  submission: Submission;
  statuses: PostInfoStatus[];
  website: string;
}

const AccountPostStatus: React.SFC<PostInfoStatus> = props => {
  let status: any = 'default';
  let text = 'Initializing...';
  switch (props.status) {
    case 'SUCCESS':
      status = 'success';
      text = `Done${props.source ? ` ${props.source}` : ''}`;
      break;
    case 'FAILED':
      status = 'error';
      text = `Failed (${props.error})`;
      break;
    case 'CANCELLED':
      status = 'warning';
      text = 'Cancelled';
      break;
    case 'UNPOSTED':
      if (props.isPosting) {
        status = 'processing';
        text = 'Posting';
      } else {
        status = 'warning';
        if (props.waitingForCondition) {
          text = 'Waiting for other websites to obtain source url';
        } else {
          text = `Will post at ${new Date(props.postAt).toLocaleTimeString()}`;
        }
      }
      break;
  }
  return (
    <div>
      <span className="w-1/4 mr-1">{loginStatusStore.getAliasForAccountId(status.accountId)}</span>
      <span>
        <Badge status={status} text={text} />
      </span>
    </div>
  );
};
