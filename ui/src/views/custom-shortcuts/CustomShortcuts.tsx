import React from 'react';
import { inject, observer } from 'mobx-react';
import { CustomShortcutStore } from '../../stores/custom-shortcut.store';
import CustomShortcutService from '../../services/custom-shortcut.service';
import { Empty, Button, Modal, Input } from 'antd';

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

  createNewShortcut(shortcut: string) {
    CustomShortcutService.create({
      shortcut,
      content: '',
      isStatic: true
    });
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
    this.setState({ newShortcutValue: target.value });
  }

  render() {
    const shortcuts = this.props.customShortcutStore!.shortcuts;
    return (
      <div>
        {shortcuts.length ? (
          ''
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
            disabled:
              !this.state.newShortcutValue.length ||
              !this.isUniqueShortcut(this.state.newShortcutValue)
          }}
          onCancel={this.hideCreationModal.bind(this)}
          onOk={() => this.createNewShortcut(this.state.newShortcutValue)}
          title="Shortcut (Must be unique)"
          visible={this.state.createModalVisible}
        >
          <em>{`{${this.state.newShortcutValue}}`}</em>
          <Input
            className="w-full"
            value={this.state.newShortcutValue}
            onChange={this.onNameChange.bind(this)}
          />
        </Modal>
      </div>
    );
  }
}
