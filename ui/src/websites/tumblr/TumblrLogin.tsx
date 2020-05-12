import React from 'react';
import ReactDOM from 'react-dom';
import { LoginDialogProps } from '../interfaces/website.interface';
import { Spin } from 'antd';
import { Authorizer } from '../interfaces/authorizer.interface';
import { TumblrAccountData } from '../../../../electron-app/src/websites/tumblr/tumblr-account.interface';
import LoginService from '../../services/login.service';

interface State {
  loading: boolean;
}

export class TumblrLogin extends React.Component<LoginDialogProps, State> {
  private authorizer: Authorizer;
  state: State = {
    loading: true
  };

  constructor(props: LoginDialogProps) {
    super(props);
    this.authorizer = window.electron.auth.tumblr;
    this.authorizer.start(this.updateAuthData.bind(this));
  }

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    if (node instanceof HTMLElement) {
      const view: any = node.querySelector('.webview');
      view.addEventListener('did-stop-loading', () => {
        if (this.state.loading) this.setState({ loading: false });
      });
      view.allowpopups = true;
      view.partition = `persist:${this.props.account._id}`;
      view.src = window.electron.auth.tumblr.getAuthURL();
    }
  }

  updateAuthData(data: TumblrAccountData) {
    console.log(data);
    LoginService.setAccountData(this.props.account._id, data);
  }

  render() {
    return (
      <div className="h-full w-full">
        <Spin wrapperClassName="full-size-spinner" spinning={this.state.loading}>
          <webview className="webview h-full w-full" webpreferences="nativeWindowOpen=1" />
        </Spin>
      </div>
    );
  }
}
