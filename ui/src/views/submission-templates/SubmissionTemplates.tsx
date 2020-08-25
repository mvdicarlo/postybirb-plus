import React from 'react';
import * as _ from 'lodash';
import { SubmissionTemplateStore } from '../../stores/submission-template.store';
import { headerStore } from '../../stores/header.store';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import { SubmissionTemplate } from '../../../../electron-app/src/server/submission/submission-template/interfaces/submission-template.interface';
import SubmissionTemplateService from '../../services/submission-template.service';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import {
  List,
  Button,
  Input,
  Modal,
  Popconfirm,
  Typography,
  Avatar,
  message,
  Icon,
  Form,
  Radio
} from 'antd';

interface Props {
  submissionTemplateStore?: SubmissionTemplateStore;
}

@inject('submissionTemplateStore')
@observer
export default class SubmissionTemplates extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    headerStore.updateHeaderState({
      title: 'Submission Templates',
      routes: [
        {
          path: `/submission-templates`,
          breadcrumbName: `Submission Templates`
        }
      ]
    });
  }

  render() {
    return (
      <div className="submission-templates">
        <div className="my-2">
          <SubmissionTemplateCreator />
        </div>
        <List
          loading={this.props.submissionTemplateStore!.isLoading}
          dataSource={this.props.submissionTemplateStore!.all}
          renderItem={(item: SubmissionTemplate) => <ListItem {...item} />}
        />
      </div>
    );
  }
}

interface SubmissionTemplateCreatorState {
  createModalVisible: boolean;
  selectedType?: SubmissionType;
  alias: string;
}

class SubmissionTemplateCreator extends React.Component<any, SubmissionTemplateCreatorState> {
  state: SubmissionTemplateCreatorState = {
    createModalVisible: false,
    alias: ''
  };

  createTemplate() {
    if (this.templateIsValid()) {
      SubmissionTemplateService.createTemplate(this.state.alias, this.state.selectedType!)
        .then(() => message.success('Submission template created.'))
        .catch(() => message.error('Failed to create submission template.'));
      this.hideModal();
    } else {
      message.warn('Template is not valid.');
    }
  }

  hideModal() {
    this.setState({ createModalVisible: false });
  }

  showModal() {
    this.setState({ createModalVisible: true, alias: '', selectedType: SubmissionType.FILE });
  }

  templateIsValid(): boolean {
    return !!this.state.alias.trim() && !!this.state.selectedType;
  }

  render() {
    return (
      <div>
        <Button type="primary" onClick={this.showModal.bind(this)} block>
          Create
        </Button>
        <Modal
          title="Create Submission Template"
          destroyOnClose={true}
          visible={this.state.createModalVisible}
          onCancel={this.hideModal.bind(this)}
          onOk={this.createTemplate.bind(this)}
          okButtonProps={{ disabled: !this.templateIsValid() }}
        >
          <Form
            layout="vertical"
            onSubmit={e => {
              e.preventDefault();
              this.createTemplate();
            }}
          >
            <Form.Item label="Name" required>
              <Input
                autoFocus
                required
                value={this.state.alias}
                onChange={({ target }) => this.setState({ alias: target.value })}
              />
            </Form.Item>
            <Form.Item label="Type" required>
              <Radio.Group
                value={this.state.selectedType}
                onChange={({ target }) => this.setState({ selectedType: target.value })}
              >
                {Object.values(SubmissionType).map(type => (
                  <Radio.Button value={type}>{_.capitalize(type)}</Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

interface ListItemState {
  renameModalVisible: boolean;
  renameValue: string;
}

class ListItem extends React.Component<SubmissionTemplate, ListItemState> {
  state: ListItemState = {
    renameModalVisible: false,
    renameValue: ''
  };

  hideRenameModal() {
    this.setState({ renameModalVisible: false });
  }

  showRenameModal() {
    this.setState({ renameModalVisible: true, renameValue: this.props.alias });
  }

  updateName() {
    if (this.renameIsValid()) {
      SubmissionTemplateService.renameTemplate(this.props._id, this.state.renameValue.trim())
        .then(() => message.success('Submission template renamed'))
        .catch(() => message.error('Failed to rename submission template.'));
      this.hideRenameModal();
    } else {
      message.warn('Name is not valid or is the same.');
    }
  }

  renameIsValid(): boolean {
    return !!this.state.renameValue && this.state.renameValue !== this.props.alias;
  }

  setRenameValue({ target }) {
    this.setState({ renameValue: target.value });
  }

  render() {
    return (
      <List.Item
        actions={[
          <Link to={`/edit/submission-template/${this.props._id}`}>
            <span key="template-edit">Edit</span>
          </Link>,
          <Popconfirm
            cancelText="No"
            okText="Yes"
            title="Are you sure you want to delete? This action cannot be undone."
            onConfirm={() => SubmissionTemplateService.removeTemplate(this.props._id)}
          >
            <Typography.Text type="danger">Delete</Typography.Text>
          </Popconfirm>
        ]}
      >
        <List.Item.Meta
          avatar={
            <div>
              {this.props.type === SubmissionType.FILE ? (
                <Avatar icon="file" shape="square" />
              ) : (
                <Avatar icon="notification" shape="square" />
              )}
            </div>
          }
          title={
            <div>
              <span className="mr-1">{this.props.alias}</span>
              <Icon type="edit" onClick={this.showRenameModal.bind(this)} />
              <Modal
                visible={this.state.renameModalVisible}
                title="Rename"
                onOk={this.updateName.bind(this)}
                onCancel={this.hideRenameModal.bind(this)}
                okButtonProps={{ disabled: !this.renameIsValid() }}
                destroyOnClose={true}
              >
                <Form
                  onSubmit={e => {
                    e.preventDefault();
                    this.updateName();
                  }}
                >
                  <Input
                    className="w-full"
                    required
                    autoFocus
                    onInput={this.setRenameValue.bind(this)}
                    value={this.state.renameValue}
                    placeholder="Submission template name"
                  />
                </Form>
              </Modal>
            </div>
          }
          description={
            <div>
              <div>{_.capitalize(this.props.type)}</div>
              <div>Created {new Date(this.props.created).toLocaleString()}</div>
            </div>
          }
        ></List.Item.Meta>
      </List.Item>
    );
  }
}
