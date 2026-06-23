import { Button, Form, Input, message } from 'antd';
import Axios from 'axios';
import { SoFurryAccountData } from 'postybirb-commons';
import React from 'react';
import BrowserLink from '../../components/BrowserLink';
import LoginService from '../../services/login.service';
import { LoginDialogProps } from '../interfaces/website.interface';

interface State extends SoFurryAccountData {
  sending: boolean;
}

export default class SoFurryLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    token: '',
    username: '',
    sending: false,
  };

  constructor(props: LoginDialogProps) {
    super(props);
    this.state = {
      ...this.state,
      ...(props.data as State),
    };
  }

  submit() {
    const token = (this.state.token || '').trim();
    if (!token) {
      return;
    }

    this.setState({ sending: true });
    Axios.get<{ handle: string; username: string }>('https://api.sofurry.com/v1/user/me', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      responseType: 'json',
    })
      .then(res => {
        if (res.data && res.data.username) {
          const data: SoFurryAccountData = {
            token,
            username: res.data.username,
          };
          LoginService.setAccountData(this.props.account._id, data)
            .then(() => {
              message.success('Login success.');
            })
            .catch(() => {
              message.error('Failed to store login.');
            })
            .finally(() => this.setState({ sending: false }));
        } else {
          message.error('Authentication failed.');
          this.setState({ sending: false });
        }
      })
      .catch(() => {
        message.error('Authentication failed.');
        this.setState({ sending: false });
      });
  }

  render() {
    return (
      <div className="container mt-6">
        <Form layout="vertical">
          <Form.Item
            label="Personal Access Token"
            required
            extra={
              <div>
                <BrowserLink url="https://www.sofurry.com/settings/pat-create">
                  Generate a Personal Access Token in your SoFurry account settings.
                </BrowserLink>
              </div>
            }
          >
            <Input
              type="password"
              className="w-full"
              value={this.state.token}
              onChange={({ target }) => this.setState({ token: target.value })}
            />
          </Form.Item>
          <Form.Item>
            <Button
              disabled={!this.state.token}
              onClick={this.submit.bind(this)}
              loading={this.state.sending}
              block
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}
