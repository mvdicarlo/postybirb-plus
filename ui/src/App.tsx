import React from 'react';
import AppLayout from './views/app-layout/AppLayout';
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

export default class App extends React.Component {
  render() {
    return (
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
      >
        <AppLayout />
      </Provider>
    );
  }
}
