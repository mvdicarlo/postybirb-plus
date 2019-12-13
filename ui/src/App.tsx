import React from 'react';
import AppLayout from './views/app-layout/AppLayout';
import { Provider } from 'mobx-react';
import { uiStore } from './stores/ui.store';
import { submissionStore } from './stores/submission.store';
import { headerStore } from './stores/header.store';
import { loginStatusStore } from './stores/login-status.store';
import { tagGroupStore } from './stores/tag-group.store';
import { settingsStore } from './stores/settings.store';
import { descriptionTemplateStore } from './stores/description-template.store';
export default class App extends React.Component {
  render() {
    return (
      <Provider
        uiStore={uiStore}
        submissionStore={submissionStore}
        headerStore={headerStore}
        loginStatusStore={loginStatusStore}
        tagGroupStore={tagGroupStore}
        descriptionTemplateStore={descriptionTemplateStore}
        settingsStore={settingsStore}
      >
        <AppLayout></AppLayout>
      </Provider>
    );
  }
}
