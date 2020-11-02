import React from 'react';
import AppLayout from './views/app-layout/AppLayout';
import { HashRouter as Router } from 'react-router-dom';
import { Modal } from 'antd';
import { Provider } from 'mobx-react';
import { descriptionTemplateStore } from './stores/description-template.store';
import { headerStore } from './stores/header.store';
import { loginStatusStore } from './stores/login-status.store';
import { settingsStore } from './stores/settings.store';
import { submissionStore } from './stores/submission.store';
import { submissionTemplateStore } from './stores/submission-template.store';
import { tagGroupStore } from './stores/tag-group.store';
import { uiStore } from './stores/ui.store';
import { updateStore } from './stores/update.store';
import { postStatusStore } from './stores/post-status.store';
import { notificationStore } from './stores/notification.store';
import { customShortcutStore } from './stores/custom-shortcut.store';
import { tagConverterStore } from './stores/tag-converter.store';

interface State {
  confirmationMessage?: string;
  showConfirmation: boolean;
  confirmationCallback?: (confirm: boolean) => void;
}

export default class App extends React.Component {
  state: State = {
    confirmationMessage: undefined,
    showConfirmation: false
  };

  private chooseConfirmation(confirmation: boolean): void {
    this.state.confirmationCallback!(confirmation);
    this.setState({
      showConfirmation: false,
      confirmationMessage: undefined,
      confirmationCallback: undefined
    });
  }

  render() {
    return (
      <Router
        basename="/"
        getUserConfirmation={(
          confirmationMessage: string,
          confirmationCallback: (confirm: boolean) => void
        ) => {
          this.setState({ confirmationMessage, confirmationCallback, showConfirmation: true });
        }}
      >
        <Provider
          descriptionTemplateStore={descriptionTemplateStore}
          headerStore={headerStore}
          loginStatusStore={loginStatusStore}
          settingsStore={settingsStore}
          submissionStore={submissionStore}
          submissionTemplateStore={submissionTemplateStore}
          tagGroupStore={tagGroupStore}
          uiStore={uiStore}
          updateStore={updateStore}
          postStatusStore={postStatusStore}
          notificationStore={notificationStore}
          customShortcutStore={customShortcutStore}
          tagConverterStore={tagConverterStore}
        >
          <Modal
            visible={this.state.showConfirmation}
            onCancel={this.chooseConfirmation.bind(this, false)}
            onOk={this.chooseConfirmation.bind(this, true)}
          >
            <div>{this.state.confirmationMessage || 'Are you sure you want to navigate?'}</div>
          </Modal>
          <AppLayout />
        </Provider>
      </Router>
    );
  }
}
