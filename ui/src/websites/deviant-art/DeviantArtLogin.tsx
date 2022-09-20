import React from 'react';
import ReactDOM from 'react-dom';
import { LoginDialogProps } from '../interfaces/website.interface';
import { Spin, message } from 'antd';
import { Authorizer } from '../interfaces/authorizer.interface';
import { DeviantArtAccountData } from 'postybirb-commons';
import LoginService from '../../services/login.service';

interface State {
  loading: boolean;
}

export class DeviantArtLogin extends React.Component<LoginDialogProps, State> {
  private authorizer: Authorizer;
  state: State = {
    loading: true
  };

  constructor(props: LoginDialogProps) {
    super(props);
    this.authorizer = window.electron.auth.DeviantArt;
    this.authorizer.start(this.updateAuthData.bind(this));
  }

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    if (node instanceof HTMLElement) {
      const view: any = node.querySelector('.webview');
      view.addEventListener('did-stop-loading', () => {
        if (this.state.loading) this.setState({ loading: false });
      });
      view.addEventListener('did-navigate', () => {
        if (this.state.loading) this.setState({ loading: false });
      });
      view.allowpopups = true;
      view.partition = `persist:${this.props.account._id}`;
      view.src = window.electron.auth.DeviantArt.getAuthURL();
    }
  }

  updateAuthData(data: DeviantArtAccountData) {
    if (data && data.access_token) {
      LoginService.setAccountData(this.props.account._id, data).then(() => {
        message.success('Deviant Art Authenticated.');
      });
    } else {
      message.error('Failed to authententicate Deviant Art.');
    }
  }

  render() {
    return (
      <div className="h-full w-full">
        <Spin wrapperClassName="full-size-spinner" spinning={this.state.loading}>
          <webview className="webview h-full w-full" />
        </Spin>
      </div>
    );
  }
}
