import React from 'react';
import SubmissionService from '../../../services/submission.service';
import { SubmissionType } from 'postybirb-commons';
import { Button, Input, message, Form, Modal, Checkbox } from 'antd';
import SubmissionTemplateSelect from '../submission-template-select/SubmissionTemplateSelect';
import { SubmissionPart } from 'postybirb-commons';
import _ from 'lodash';

interface NotificationSubmissionCreateState {
  keepTemplateTitle: boolean;
  modalVisible: boolean;
  value: string;
  parts?: Record<string, SubmissionPart<any>>;
}

export class NotificationSubmissionCreator extends React.Component<
  any,
  NotificationSubmissionCreateState
> {
  state: NotificationSubmissionCreateState = {
    keepTemplateTitle: false,
    modalVisible: false,
    value: '',
    parts: undefined
  };

  createSubmission() {
    if (this.isValid()) {
      const sanitizedParts = _.cloneDeep(this.state.parts);
      if (sanitizedParts && !this.state.keepTemplateTitle) {
        Object.values(sanitizedParts).forEach(part => {
          delete part.data.title;
        });
      }
      SubmissionService.create({
        type: SubmissionType.NOTIFICATION,
        title: this.state.value || 'PLACEHOLDER',
        parts: sanitizedParts ? JSON.stringify(Object.values(sanitizedParts)) : undefined
      })
        .then(() => message.success('Submission created.'))
        .catch(() => message.error('Failed to create submission.'));
      this.hideModal();
    }
  }

  hideModal() {
    this.setState({ modalVisible: false, value: '', parts: undefined, keepTemplateTitle: false });
  }

  showModal() {
    this.setState({ modalVisible: true });
  }

  onNameChange({ target }) {
    this.setState({ value: target.value });
  }

  isValid(): boolean {
    return this.state.keepTemplateTitle && this.state.parts
      ? true
      : !!this.state.value && !!this.state.value.trim().length;
  }

  render() {
    return (
      <div>
        <Button onClick={this.showModal.bind(this)} size="large" type="primary" block>
          Create Notification
        </Button>
        <Modal
          destroyOnClose={true}
          okButtonProps={{ disabled: !this.isValid() }}
          onCancel={this.hideModal.bind(this)}
          onOk={this.createSubmission.bind(this)}
          title="New Notification"
          visible={this.state.modalVisible}
        >
          <Form
            layout="vertical"
            onSubmit={e => {
              e.preventDefault();
              this.createSubmission();
            }}
          >
            <Form.Item label="Name" required>
              <Input
                autoFocus
                required
                className="w-full"
                value={this.state.value}
                onChange={this.onNameChange.bind(this)}
              />
            </Form.Item>
            <SubmissionTemplateSelect
              label="With Template"
              submissionType={SubmissionType.NOTIFICATION}
              onDeselect={() => this.setState({ parts: undefined })}
              onSelect={(id, type, parts) => this.setState({ parts })}
            />
            {this.state.parts ? (
              <Form.Item>
                <Checkbox
                  value={this.state.keepTemplateTitle}
                  onChange={e => this.setState({ keepTemplateTitle: e.target.checked })}
                >
                  Use title from template
                </Checkbox>
              </Form.Item>
            ) : null}
          </Form>
        </Modal>
      </div>
    );
  }
}
