import React from 'react';
import 'antd/dist/antd.css';
import AppLayout from './views/app-layout/AppLayout';
import { ConfigProvider } from 'antd';
import { Provider } from 'mobx-react';
import { uiStore } from './stores/ui.store';
import { submissionStore } from './stores/submission.store';

export default class App extends React.Component {
  render() {
    return (
      <ConfigProvider>
        <Provider uiStore={uiStore} submissionStore={submissionStore}>
          <AppLayout></AppLayout>
        </Provider>
      </ConfigProvider>
    );
  }
}
