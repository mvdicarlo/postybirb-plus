import { Button, Form, Input, message, Spin } from 'antd';
import Axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom';
import { TumblrAccountData } from 'postybirb-commons';
import LoginService from '../../services/login.service';
import { LoginDialogProps } from '../interfaces/website.interface';

interface State {
  loading: boolean;
  pin: string;
}

export class TwitterLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    loading: true,
    pin: ''
  };

  private oauth_token: string = '';

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    if (node instanceof HTMLElement) {
      const view: any = node.querySelector('.webview');
      view.addEventListener('did-stop-loading', () => {
        if (this.state.loading) this.setState({ loading: false });
      });
      view.allowpopups = true;
      view.partition = `persist:${this.props.account._id}`;
      Axios.get<{ data: { url: string; oauth_token: string } }>(
        `${window.AUTH_SERVER_URL}/twitter/v2/authorize`
      )
        .then(({ data }) => {
          view.src = data.data.url;
          this.oauth_token = data.data.oauth_token;
          this.setState({ loading: false });
        })
        .catch(() => {
          message.error('A problem occurred when attempting to contact authentication server.');
        });
    }
  }

  updateAuthData(data: TumblrAccountData) {
    LoginService.setAccountData(this.props.account._id, data).then(() => {
      message.success('Twitter Authenticated.');
    });
  }

  isValid(): boolean {
    return !!this.state.pin;
  }

  submit() {
    Axios.post<{ success: boolean; error: string; data: any }>(
      `${window.AUTH_SERVER_URL}/twitter/v2/authorize/`,
      {
        verifier: this.state.pin.trim(),
        oauth_token: this.oauth_token
      },
      { responseType: 'json' }
    )
      .then(({ data }) => {
        if (data.success) {
          LoginService.setAccountData(this.props.account._id, data.data).then(() => {
            message.success('Twitter authenticated.');
          });
        } else {
          message.error(data.error);
        }
      })
      .catch(() => {
        message.error('Failed to authenticate Twitter.');
      });
  }

  render() {
    return (
      <div className="h-full w-full">
        <div className="container">
          <Form layout="vertical">
            <Form.Item label="Authentication PIN" required>
              <Input
                className="w-full"
                value={this.state.pin}
                onChange={({ target }) => this.setState({ pin: target.value })}
                addonAfter={
                  <Button onClick={this.submit.bind(this)} disabled={!this.isValid()}>
                    Authorize
                  </Button>
                }
              />
            </Form.Item>
          </Form>
        </div>
        <Spin wrapperClassName="full-size-spinner" spinning={this.state.loading}>
          <webview className="webview h-full w-full" webpreferences="nativeWindowOpen=1" />
        </Spin>
      </div>
    );
  }
}
