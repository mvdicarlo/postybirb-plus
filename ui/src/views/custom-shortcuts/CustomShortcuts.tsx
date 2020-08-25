import React from 'react';
import { inject, observer } from 'mobx-react';
import { CustomShortcutStore } from '../../stores/custom-shortcut.store';
import CustomShortcutService from '../../services/custom-shortcut.service';
import {
  Empty,
  Button,
  Modal,
  Input,
  message,
  Spin,
  Form,
  Card,
  Icon,
  Popconfirm,
  Switch,
  Alert,
  Popover
} from 'antd';
import { CustomShortcut } from '../../../../electron-app/src/server/custom-shortcut/interfaces/custom-shortcut.interface';
import _ from 'lodash';
import DescriptionInput from '../submissions/submission-forms/form-components/DescriptionInput';

interface Props {
  customShortcutStore?: CustomShortcutStore;
}

interface State {
  createModalVisible: boolean;
  newShortcutValue: string;
}

@inject('customShortcutStore')
@observer
export default class CustomShortcuts extends React.Component<Props> {
  state: State = {
    createModalVisible: false,
    newShortcutValue: ''
  };

  createNewShortcut() {
    if (this.isValid()) {
      this.setState({ createModalVisible: false });
      CustomShortcutService.create({
        shortcut: this.state.newShortcutValue,
        content: '',
        isDynamic: false
      });
    }
  }

  isUniqueShortcut(shortcut: string): boolean {
    const existingShortcuts = this.props.customShortcutStore!.shortcuts.map(s => s.shortcut);
    return !existingShortcuts.includes(shortcut.trim());
  }

  showCreationModal() {
    this.setState({ createModalVisible: true, newShortcutValue: '' });
  }

  hideCreationModal() {
    this.setState({ createModalVisible: false });
  }

  onNameChange({ target }) {
    this.setState({ newShortcutValue: target.value.replace(/[^a-zA-Z0-9]/g, '') });
  }

  isValid(): boolean {
    return (
      !!this.state.newShortcutValue.length && this.isUniqueShortcut(this.state.newShortcutValue)
    );
  }

  render() {
    const shortcuts = this.props.customShortcutStore!.shortcuts;
    return (
      <div>
        <Alert
          className="mb-1"
          type="warning"
          message="Do not put custom shortcuts inside of custom shortcuts"
          description={
            <div>
              Putting a custom shortcut inside of another custom shortcut will cause unexpected
              behavior.
            </div>
          }
        />
        {shortcuts.length ? (
          <div>
            <Button className="mb-2" type="primary" onClick={this.showCreationModal.bind(this)}>
              Add New Shortcut
            </Button>
            {shortcuts.map((t: CustomShortcut) => (
              <div className="mb-2">
                <CustomShortcutEditor key={t._id} shortcut={t} />
              </div>
            ))}
          </div>
        ) : (
          <Empty description={<span>No custom shortcuts</span>}>
            <Button type="primary" onClick={this.showCreationModal.bind(this)}>
              Create Custom Shortcut
            </Button>
          </Empty>
        )}
        <Modal
          destroyOnClose={true}
          okButtonProps={{
            disabled: !this.isValid()
          }}
          onCancel={this.hideCreationModal.bind(this)}
          onOk={this.createNewShortcut.bind(this)}
          title="Shortcut (Must be unique)"
          visible={this.state.createModalVisible}
        >
          <Form
            onSubmit={e => {
              e.preventDefault();
              this.createNewShortcut();
            }}
          >
            <code>{`{${this.state.newShortcutValue}}`}</code>
            <Input
              autoFocus
              required
              className="w-full"
              value={this.state.newShortcutValue}
              onChange={this.onNameChange.bind(this)}
            />
          </Form>
        </Modal>
      </div>
    );
  }
}

interface EditorProps {
  shortcut: CustomShortcut;
}

interface EditorState {
  shortcut: Partial<CustomShortcut>;
  touched: boolean;
  saving: boolean;
}

class CustomShortcutEditor extends React.Component<EditorProps, EditorState> {
  state: EditorState = {
    shortcut: {},
    touched: false,
    saving: false
  };

  private original!: CustomShortcut;

  constructor(props: EditorProps) {
    super(props);
    Object.assign(this.state.shortcut, props.shortcut);
    this.original = _.cloneDeep(props.shortcut);
  }

  onSave = () => {
    if (!this.state.touched) {
      message.info('No changes to save.');
      return;
    }

    this.setState({ saving: true });
    CustomShortcutService.update(this.state.shortcut)
      .then(() => {
        this.setState({ saving: false, touched: false });
        message.success('Custom shortcut updated.');
      })
      .catch(err => {
        this.setState({ saving: false });
        message.error('Shortcut cannot be empty.');
      });
  };

  onDelete = () => {
    CustomShortcutService.remove(this.props.shortcut._id)
      .then(() => message.success('Custom shortcut removed.'))
      .catch(() => message.error('Failed to remove shortcut.'));
  };

  handleShortcutChange = (fieldName: string, { target }) => {
    const copy = _.cloneDeep(this.state.shortcut);
    copy[fieldName] = target.value.replace(/[^a-zA-Z0-9]/g, '').trim();
    this.setState({ touched: !_.isEqual(copy, this.original), shortcut: copy });
  };

  handleContentChange = ({ value }) => {
    const copy = _.cloneDeep(this.state.shortcut);
    copy.content = value;
    this.setState({ touched: !_.isEqual(copy, this.original), shortcut: copy });
  };

  handleDynamicChange = checked => {
    const copy = _.cloneDeep(this.state.shortcut);
    copy.isDynamic = checked;
    this.setState({ touched: !_.isEqual(copy, this.original), shortcut: copy });
  };

  render() {
    return (
      <div>
        <Spin spinning={this.state.saving} delay={500}>
          <Form layout="vertical">
            <Card
              size="small"
              title={
                <div>
                  <code>{`{${this.state.shortcut.shortcut}${
                    this.state.shortcut.isDynamic ? ':<dynamic content>' : ''
                  }}`}</code>
                  <br />
                  <Input
                    defaultValue={this.state.shortcut.shortcut}
                    required={true}
                    onBlur={this.handleShortcutChange.bind(this, 'shortcut')}
                    placeholder="Shortcut"
                  />
                </div>
              }
              actions={[
                <Icon type="save" key="save" onClick={this.onSave} />,
                <Popconfirm title="Are you sure?" onConfirm={this.onDelete}>
                  <Icon type="delete" key="delete" />
                </Popconfirm>
              ]}
            >
              <Form.Item
                label={
                  <span>
                    <span>Enable Dynamic Input</span>
                    <Popover
                      title="Dynamic Input"
                      content={
                        <div>
                          <div className="mb-2">
                            Enabling dynamic input allows you to make the shortcut more dynamic.
                            <br />
                            <span>
                              This turns your shortcut from{' '}
                              <code>{`{${this.state.shortcut.shortcut}}`}</code> to
                            </span>
                            <code>{` {${this.state.shortcut.shortcut}:<dynamic content>}`}</code>.
                            <br />
                            Any text after the : will appear in your shortcut text anywhere you have
                            placed a {'{$}'}
                          </div>
                          <div>
                            <strong>Example:</strong>
                            <br />
                            <span> An example of a dynamic shortcut would be</span>
                            <code>{`{${this.state.shortcut.shortcut ||
                              'example'}:Monday through Friday}`}</code>
                            <br />
                            And if the content was: <code>I am available {'{$}'}</code>
                            <br />
                            <span>Then the output would be: </span>
                            <code>I am available Monday through Friday</code>
                          </div>
                        </div>
                      }
                    >
                      <Icon className="text-sm ml-1 text-primary" type="info-circle" />
                    </Popover>
                  </span>
                }
              >
                <Switch
                  checked={this.state.shortcut.isDynamic}
                  onChange={this.handleDynamicChange}
                />
              </Form.Item>
              <DescriptionInput
                defaultValue={{ overwriteDefault: false, value: this.state.shortcut.content! }}
                onChange={this.handleContentChange}
                hideOverwrite={true}
                hideShortcuts={true}
              />
            </Card>
          </Form>
        </Spin>
      </div>
    );
  }
}
