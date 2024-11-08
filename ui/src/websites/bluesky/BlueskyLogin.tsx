import { Alert, Button, Form, Input, message } from 'antd';
import React from 'react';
import { BlueskyAccountData } from 'postybirb-commons';
import LoginService from '../../services/login.service';
import { LoginDialogProps } from '../interfaces/website.interface';

interface State extends BlueskyAccountData {
  loading: boolean;
}

export default class BlueskyLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    username: '',
    password: '',
    loading: true,
  };

  constructor(props: LoginDialogProps) {
    super(props);
    this.state = {
      ...this.state,
      ...(props.data as State),
    };
  }

  submit() {
    LoginService.setAccountData(this.props.account._id, {
      username: this.state.username,
      password: this.state.password,
    })
      .then(() => {
        LoginService.checkLogin(this.props.account._id)
          .then(res => {
            if (res.data?.loggedIn) {
              message.success('Logged in successfully. You can close this page now.');
            } else {
              message.error('Login failed.');
            }
          })
          .catch(e => {
            console.error('checkLogin failed', e);
            message.error(`Failed to check login status: ${e}`);
          });
      })
      .catch(e => {
        console.error('setAccountData failed', e);
        message.error(`Failed to set account data: ${e}`);
      });
  }

  isValid(): boolean {
    return !!this.state.username && !!this.state.password;
  }

  render() {
    return (
      <div className="h-full">
        <div className="container">
          <Form layout="vertical">
            <Form.Item
              label="Username"
              help="Your DID or handle - for example yourname.bsky.social"
              required
            >
              <Input
                value={this.state.username}
                onChange={({ target }) => this.setState({ username: target.value })}
              />
              {this.state.username.startsWith('@') && (
                <Alert
                  type="warning"
                  message="You don't need to input the @"
                  description={
                    <div>
                      Unless your username <strong>really</strong> contains it
                    </div>
                  }
                />
              )}
              {this.state.username && !this.state.username.includes('.') && (
                <Alert
                  type="warning"
                  message="Be sure that the username is in the format handle.bsky.social"
                  description={
                    <div>
                      Or if you are using custom domain, make sure to include full username, e.g.
                      domain.ext, handle.domain.ext
                    </div>
                  }
                />
              )}
            </Form.Item>
            <Form.Item
              label="Password"
              help="An *app* password - you can get one of these in Settings"
              required
            >
              <Input
                value={this.state.password}
                onChange={({ target }) => this.setState({ password: target.value })}
              />
            </Form.Item>
          </Form>
          <Button onClick={this.submit.bind(this)} disabled={!this.isValid()}>
            Save
          </Button>
        </div>
      </div>
    );
  }
}
