import React from 'react';
import { LoginDialogProps } from '../interfaces/website.interface';
import { Spin } from 'antd';

interface State {
  loading: boolean;
}

export class InstagramLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    loading: false,
  };

  render() {
    return (
      <div className="h-full w-full">
        <Spin wrapperClassName="full-size-spinner" spinning={this.state.loading}>
          <webview
            src="https://www.instagram.com/accounts/login/"
            className="webview h-full w-full"
            webpreferences="nativeWindowOpen=1"
            allowpopups={'true' as any}
            partition={`persist:${this.props.account._id}`}
          />
        </Spin>
      </div>
    );
  }
}
