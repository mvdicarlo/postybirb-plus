import { Button, Form, Icon, Input, message, Spin } from 'antd';
import { TwitterAccountData } from 'postybirb-commons';
import React from 'react';
import ReactDOM from 'react-dom';
import BrowserLink from '../../components/BrowserLink';
import LoginService from '../../services/login.service';
import axios from '../../utils/http';
import { LoginDialogProps } from '../interfaces/website.interface';

interface State {
  loading: boolean;
  pin: string;
  secret: string;
  key: string;
}

export class TwitterLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    secret: '',
    key: '',
    loading: true,
    pin: '',
  };

  private oauth_token: string = '';

  constructor(props: LoginDialogProps) {
    super(props);
    this.state = {
      ...this.state,
      ...(props.data as State),
    };
  }

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    if (node instanceof HTMLElement) {
      const view: any = node.querySelector('.webview');
      if (!view) return; // Webview not found
      view.addEventListener('did-stop-loading', () => {
        if (this.state.loading) this.setState({ loading: false });
      });
      view.allowpopups = true;
      view.partition = `persist:${this.props.account._id}`;
      axios
        .get<{ data: { url: string; oauth_token: string } }>(`/twitter/v2/authorize`, {
          params: {
            key: this.state.key,
            secret: this.state.secret,
          },
        })
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

  updateAuthData(data: TwitterAccountData) {
    LoginService.setAccountData(this.props.account._id, data).then(() => {
      message.success('Twitter Authenticated.');
    });
  }

  isValid(): boolean {
    return !!this.state.pin;
  }

  isAPIValid(): boolean {
    return !!this.state.key && !!this.state.secret;
  }

  submitAPI() {
    LoginService.setAccountData(this.props.account._id, {
      key: this.state.key,
      secret: this.state.secret,
    })
      .then(() => {
        message.success('Twitter API Key and Secret saved.');
      })
      .finally(() => {
        this.componentDidMount();
      });
  }

  submit() {
    axios
      .post<{ success: boolean; error: string; data: any }>(
        `/twitter/v2/authorize/`,
        {
          verifier: this.state.pin.trim(),
          oauth_token: this.oauth_token,
          key: this.state.key,
          secret: this.state.secret,
        },
        { responseType: 'json' },
      )
      .then(({ data }) => {
        if (data.success) {
          LoginService.setAccountData(this.props.account._id, {
            secret: this.state.secret,
            key: this.state.key,
            ...data.data,
          }).then(() => {
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
    if (!this.isAPIValid()) {
      return (
        <div className="h-full w-full">
          <div className="container">
            <Form layout="vertical">
              <div>
                <h1>Twitter API Key and Secret</h1>
                <p>
                  <BrowserLink url="https://www.postybirb.com/twitter-setup.html">
                    How to get your API Key and Secret <Icon type="link" />
                  </BrowserLink>
                </p>
              </div>
              <Form.Item label="Twitter API Key" required>
                <Input
                  className="w-full"
                  value={this.state.key}
                  onChange={({ target }) => this.setState({ key: target.value })}
                />
              </Form.Item>
              <Form.Item label="Twitter API Secret" required>
                <Input
                  className="w-full"
                  value={this.state.secret}
                  onChange={({ target }) => this.setState({ secret: target.value })}
                />
              </Form.Item>
              <Button onClick={this.submitAPI.bind(this)} disabled={!this.isAPIValid()}>
                Save API Key and Secret
              </Button>
            </Form>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full">
        <div className="container">
          <Form layout="vertical">
            <div>
              <h1>Twitter API Key and Secret</h1>
              <p>
                <BrowserLink url="https://www.postybirb.com/twitter-setup.html">
                  How to get your API Key and Secret <Icon type="link" />
                </BrowserLink>
              </p>
            </div>
            <Form.Item label="Twitter API Key" required>
              <Input
                className="w-full"
                value={this.state.key}
                onChange={({ target }) => this.setState({ key: target.value })}
              />
            </Form.Item>
            <Form.Item label="Twitter API Secret" required>
              <Input
                className="w-full"
                value={this.state.secret}
                onChange={({ target }) => this.setState({ secret: target.value })}
              />
            </Form.Item>
            <Button onClick={this.submitAPI.bind(this)} disabled={!this.isAPIValid()}>
              Save API Key and Secret
            </Button>
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
          <webview className="webview h-full w-full" />
        </Spin>
      </div>
    );
  }
}
