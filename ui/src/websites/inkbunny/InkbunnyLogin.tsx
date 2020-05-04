import React from 'react';
import { LoginDialogProps } from '../interfaces/website.interface';
import { Form, Input, Button, message } from 'antd';
import LoginService from '../../services/login.service';
import BrowserLink from '../../components/BrowserLink';
import Axios from 'axios';

interface State {
  username: string;
  password: string;
  sending: boolean;
}

export default class InkbunnyLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    username: '',
    password: '',
    sending: false
  };

  constructor(props: LoginDialogProps) {
    super(props);
    this.state = {
      ...this.state,
      ...(props.data as State)
    };
  }

  async submit() {
    this.setState({ sending: true });
    const auth = await Axios.get<{ sid: string }>(
      `https://inkbunny.net/api_login.php?username=${encodeURIComponent(
        this.state.username
      )}&password=${encodeURIComponent(this.state.password)}`,
      { responseType: 'json' }
    );
    if (auth.data.sid) {
      LoginService.setAccountData(this.props.account._id, {
        username: this.state.username,
        sid: auth.data.sid
      })
        .then(() => {
          message.success('Login success.');
        })
        .catch(() => {
          message.error('Failed to login to Inkbunny account.');
        })
        .finally(() => this.setState({ sending: false }));
    } else {
      this.setState({ sending: false });
    }
  }

  isValid(): boolean {
    return !!this.state.username && !!this.state.password;
  }

  render() {
    return (
      <div className="container mt-6">
        <Form
          layout="vertical"
          onSubmit={e => {
            e.preventDefault();
            if (this.isValid()) {
              this.submit();
            }
          }}
        >
          <Form.Item label="Username" required>
            <Input
              className="w-full"
              defaultValue={this.state.username}
              onBlur={({ target }) => this.setState({ username: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Password"
            required
            extra={
              <div>
                <BrowserLink url="https://inkbunny.net/account.php">
                  You must first enable API access in your account settings [API (External
                  Scripting)].
                </BrowserLink>
              </div>
            }
          >
            <Input
              type="password"
              className="w-full"
              defaultValue={this.state.password}
              onBlur={({ target }) => this.setState({ password: target.value })}
            />
          </Form.Item>
          <Form.Item>
            <Button
              disabled={!this.isValid()}
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
