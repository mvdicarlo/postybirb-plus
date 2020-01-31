import React from 'react';
import * as sanitize from 'sanitize-html';
import { uiStore } from '../../../stores/ui.store';
import SubmissionService from '../../../services/submission.service';
import { FileSubmission } from '../../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Website } from '../../../website-components/interfaces/website.interface';
import { Card, Alert, Modal, Spin, message } from 'antd';
import { Editor } from '@tinymce/tinymce-react';
import { SubmissionPackage } from '../../../../../electron-app/src/submission/interfaces/submission-package.interface';

interface Props {
  submission: FileSubmission;
  websites: Website[];
  uploadCallback: (info: SubmissionPackage<any>) => void;
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

  private tinyMCESettings: any = {
    suffix: '.min',
    skin: uiStore!.state.theme === 'dark' ? 'oxide-dark' : 'oxide',
    inline: false,
    statusbar: false,
    paste_data_images: false,
    browser_spellcheck: false, // should be supported in electron 8
    entity_encoding: 'raw',
    paste_retain_style_properties: 'color',
    invalid_elements: 'img,audio,video',
    block_formats:
      'Paragraph=p;Header 1=h1;Header 2=h2;Header 3=h3;Header 4=h4;Header 5=h5;Header 6=h6',
    content_style: 'p {margin: 0}',
    height: '100%',
    plugins: 'preview paste hr help code',
    menubar: 'file edit insert view tools help',
    toolbar:
      'newdocument undo redo | formatselect removeformat | hr | bold italic underline strikethrough forecolor | alignleft aligncenter alignright | code help',
    templates: [],
    formats: {
      underline: { inline: 'u', exact: true },
      strikethrough: { inline: 's', exact: true }
    },
    paste_preprocess(plugin: any, args: any) {
      args.content = sanitize(args.content, {
        allowedTags: false,
        allowedAttributes: {
          a: ['href', 'target'],
          div: ['align', 'style'],
          pre: ['align', 'style'],
          p: ['align', 'style'],
          h1: ['align', 'style'],
          h2: ['align', 'style'],
          h3: ['align', 'style'],
          h4: ['align', 'style'],
          h5: ['align', 'style'],
          h6: ['align', 'style'],
          span: ['align', 'style']
        },
        allowedStyles: {
          '*': {
            'text-align': [/.*/]
          }
        }
      });
    }
  };

  showAndLoad() {
    this.setState({ loading: true, modalVisible: true });
    SubmissionService.getFallbackText(this.props.submission._id)
      .then(data => this.setState({ fallbackText: data }))
      .finally(() => this.setState({ loading: false }));
  }

  submitFallback() {
    if (this.isValid()) {
      const blob = new Blob([this.state.fallbackText.trim()], { type: 'text/html' });
      SubmissionService.changeFallback(
        this.props.submission._id,
        new File([blob], 'fallback.html', { type: 'text/html' })
      )
        .then(info => {
          this.props.uploadCallback(info);
          message.success('Fallback uploaded.');
        })
        .catch(() => {
          message.error('Failed to set fallback.');
        });
    }
  }

  isValid(): boolean {
    return Boolean(this.state.fallbackText && this.state.fallbackText.trim());
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
          onOk={this.submitFallback.bind(this)}
          okButtonProps={{ disabled: !this.isValid() }}
        >
          <div className="w-full h-full">
            {this.state.loading ? (
              <Spin className="h-full w-full" />
            ) : (
              <div className="h-full w-full">
                <Editor
                  value={this.state.fallbackText}
                  init={this.tinyMCESettings}
                  onEditorChange={description => this.setState({ fallbackText: description })}
                />
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  }
}
