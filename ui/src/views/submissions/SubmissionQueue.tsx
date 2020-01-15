import React from 'react';
import { inject, observer } from 'mobx-react';
import { PostStatusStore } from '../../stores/post-status.store';
import { List, Avatar, message, Button } from 'antd';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { submissionStore } from '../../stores/submission.store';
import PostService from '../../services/post.service';
import { Link } from 'react-router-dom';

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

  render() {
    const queued = this.props.postStatusStore!.queued.filter(q => q.type === this.props.type);
    return (
      <div>
        <div className="mb-3"></div>
        <div>
          <List
            header={
              <Button disabled={!queued.length} block type="danger" onClick={this.cancelAllQueuedSubmissions.bind(this)}>
                Cancel All
              </Button>
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
