import React from 'react';
import showdown from 'showdown';
import SubmissionService from '../../../services/submission.service';
import { FileSubmission } from '../../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Website } from '../../../website-components/interfaces/website.interface';
import { Card, Alert, Modal, Spin, Input } from 'antd';

interface Props {
  submission: FileSubmission;
  websites: Website[];
}

interface State {
  modalVisible: boolean;
  loading: boolean;
  fallbackText: string;
}

export default class FallbackStoryInput extends React.Component<Props, State> {
  state: State = {
    modalVisible: false,
    loading: false,
    fallbackText: ''
  };

  private converter: any;

  constructor(props: Props) {
    super(props);
    this.converter = new showdown.Converter();
  }

  showAndLoad() {
    this.setState({ loading: true, modalVisible: true });
    SubmissionService.getFallbackText(this.props.submission._id)
      .then(data => this.setState({ fallbackText: data }))
      .finally(() => this.setState({ loading: false }));
  }

  render() {
    if (this.props.submission.primary.type !== 'TEXT') {
      return null;
    }

    const unsupportedWebsite = this.props.websites
      .filter(w => w.supportsTextType)
      .filter(w => !w.supportsTextType!(this.props.submission.primary.mimetype))
      .map(w => w.name);

    if (!unsupportedWebsite.length) {
      return null;
    }

    return (
      <div className="mt-2">
        <Card
          size="small"
          bordered
          title="Text Fallback"
          extra={
            <span className="text-link" onClick={this.showAndLoad.bind(this)}>
              Edit
            </span>
          }
        >
          {this.props.submission.fallback ? (
            <span className="text-success">Fallback file provided</span>
          ) : (
            <Alert
              type="error"
              message="No Fallback File"
              description={
                <div>
                  {unsupportedWebsite.join()} does not support{' '}
                  {this.props.submission.primary.mimetype}.
                  <br />
                  Please provide a simplified version.
                </div>
              }
            />
          )}
        </Card>
        <Modal
          title="Fallback"
          visible={this.state.modalVisible}
          destroyOnClose={true}
          onCancel={() => this.setState({ modalVisible: false })}
          wrapClassName="fullscreen-modal-with-footer"
          mask={false}
          okText="Save"
        >
          <div className="w-full h-full">
            {this.state.loading ? (
              <Spin className="h-full w-full" />
            ) : (
              <div className="h-full w-full flex">
                <div className="pr-1" style={{ width: '50%', borderRight: '1px solid lightgray' }}>
                  <Input.TextArea
                    className="border-none h-full-important resize-none"
                    defaultValue={this.state.fallbackText}
                    placeholder="Enter fallback text here."
                    onChange={({ target }) => this.setState({ fallbackText: target.value })}
                  />
                </div>
                <div className="pl-1 max-h-full overflow-auto" style={{ width: '50%' }}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: this.state.fallbackText
                        ? this.converter.makeHtml(this.state.fallbackText)
                        : 'No content for preview provided.'
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  }
}
