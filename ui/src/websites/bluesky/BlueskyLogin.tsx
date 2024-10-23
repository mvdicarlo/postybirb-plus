import { Alert, Button, Form, Input, message } from 'antd';
import React from 'react';
import { BlueskyAccountData } from 'postybirb-commons';
import LoginService from '../../services/login.service';
import { LoginDialogProps } from '../interfaces/website.interface';
import fetch from 'node-fetch';
import FormData from 'form-data';
// HACK: The atproto library contains some kind of invalid typescript
// declaration in @atproto/api, so we can't include directly from it. Rummaging
// around in the dist files directly works though.
// This hack is also present in bluesky.website.service.ts.
import { BskyAgent } from '@atproto/api/dist/bsky-agent';

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
    // HACK: The atproto library makes a half-hearted attempt at supporting Node
    // by letting you specify a fetch handler, but then uses Headers and
    // FormData unconditionally anyway, with no way to change that behavior.
    // Patching them into the global namespace is ugly, but it works.
    // This hack is also present in bluesky.website.service.ts.
    globalThis.FormData = FormData as any;
    globalThis.Headers = fetch.Headers;
    globalThis.Request = fetch.Request;
    globalThis.Response = fetch.Response;
    const agent = new BskyAgent({ service: 'https://bsky.social', fetch });

    agent
      .login({
        identifier: this.state.username,
        password: this.state.password,
      })
      .then(res => {
        if (res.success) {
          LoginService.setAccountData(this.props.account._id, this.state).then(() => {
            message.success(`Details confirmed and saved`);
          });
        } else {
          message.error(`Failed to authenticate.`);
        }
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
