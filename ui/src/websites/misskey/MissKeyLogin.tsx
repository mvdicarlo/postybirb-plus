import { Button, Form, Input, message, Spin } from 'antd';
import Axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom';
import { MissKeyAccountData } from 'postybirb-commons';
import LoginService from '../../services/login.service';
import { LoginDialogProps } from '../interfaces/website.interface';

import generator, { OAuth } from 'megalodon'

interface State extends MissKeyAccountData {
  code: string;
  client_id: string;
  client_secret: string;
  loading: boolean;
}

export default class MissKeyLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    website: 'misskey.io',
    code: '',
    loading: true,
    client_id: '',
    client_secret: '',
    tokenData: null,
    username: ''
  };

  private view: any;

  constructor(props: LoginDialogProps) {
    super(props);
    this.state = {
      ...this.state,
      ...(props.data as State)
    };
  }

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    if (node instanceof HTMLElement) {
      const view: any = node.querySelector('.webview');
      this.view = view;
      view.addEventListener('did-stop-loading', () => {
        if (this.state.loading) this.setState({ loading: false });
      });
      view.allowpopups = true;
      view.partition = `persist:${this.props.account._id}`;
      this.getAuthURL(this.state.website);
    }
  }

  private getAuthURL(website: string) {
    let auth_url : string = "";

    // Get the Auth URL ... Display it. 
    const client = generator('misskey', `https://${website}`);
    let opts: any = {
      redirect_uris: `https://localhost:${window['PORT']}/misskey/display/${window.AUTH_ID}`
    }
    client.registerApp('PostyBirb', opts )
      .then(appData => {
        this.state.client_id = appData.clientId;
        this.state.client_secret = appData.clientSecret;
        this.state.username = appData.name;
        auth_url = appData.url || "Error - no auth url";
        this.view.src = auth_url;
      });
  }

  submit() {
    const client = generator('misskey', `https://${this.state.website}`);
    client.fetchAccessToken(this.state.client_id, this.state.client_secret, this.state.code).then((value: OAuth.TokenData) => {
      // Get the username so we have complete data.
      const usernameClient = generator('misskey', `https://${this.state.website}`, value.accessToken);
      usernameClient.verifyAccountCredentials().then((res)=>{
        let website = `https://${this.state.website}`;
        this.state.username = res.data.username;
        this.state.tokenData = value;
        LoginService.setAccountData(this.props.account._id, this.state ).then(
          () => {
            message.success(`${this.state.website} authenticated.`);
          });
      });
    })
    .catch((err: Error) => {
      message.error(`Failed to authenticate ${this.state.website}.`);
    })
  }

  isValid(): boolean {
    return !!this.state.website && !!this.state.code;
  }

  render() {
    return (
      <div className="h-full">
        <div className="container">
          <Form layout="vertical">
            <Form.Item label="Website" required>
              <Input
                className="w-full"
                defaultValue={this.state.website}
                addonBefore="https://"
                onBlur={({ target }) => {
                  const website = target.value.replace(/(https:\/\/|http:\/\/)/, '');
                  this.view.loadURL(this.getAuthURL(website));
                  this.setState({ website });
                }}
              />
            </Form.Item>
            <Form.Item label="Code" help="Obtained from authenticating the website" required>
              <Input
                value={this.state.code}
                onChange={({ target }) => this.setState({ code: target.value })}
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
