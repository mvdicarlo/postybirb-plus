import React from 'react';
import { LoginDialogProps } from '../interfaces/website.interface';
import { Form, Input, Button, message } from 'antd';
import LoginService from '../../services/login.service';
import BrowserLink from '../../components/BrowserLink';

interface State {
  name: string;
  webhook: string;
  embedColor: number;
  sending: boolean;
}

export default class DiscordLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    name: '',
    webhook: '',
    embedColor: 0,
    sending: false
  };

  constructor(props: LoginDialogProps) {
    super(props);
    this.state = {
      ...this.state,
      ...(props.data as State)
    };
  }

  submit() {
    this.setState({ sending: true });
    LoginService.setAccountData(this.props.account._id, {
      name: this.state.name,
      webhook: this.state.webhook,
      embedColor: this.state.embedColor,

    })
      .then(() => {
        message.success('Discord updated.');
      })
      .catch(() => {
        message.error('Failed to update Discord account.');
      })
      .finally(() => this.setState({ sending: false }));
  }

  render() {
    return (
      <div className="container mt-6">
        <Form layout="vertical">
          <Form.Item label="Name" required>
            <Input
              className="w-full"
              defaultValue={this.state.name}
              onBlur={({ target }) => this.setState({ name: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Webhook"
            required
            extra={
              <div>
                <BrowserLink url="https://support.discordapp.com/hc/en-us/articles/228383668-Intro-to-Webhooks">
                  How to create a Webhook
                </BrowserLink>
              </div>
            }
          >
            <Input
              className="w-full"
              defaultValue={this.state.webhook}
              onBlur={({ target }) => this.setState({ webhook: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Default Embed Color Hex"
          >
            <Input
              className="w-full"
              defaultValue={this.state.embedColor.toString(16).padStart(6, "0")}
              onBlur={({ target }) => {
                if (/^#?[0-9A-F]{6}$/i.test(target.value) && parseInt(target.value, 16)) {
                  this.setState({ embedColor: parseInt(target.value, 16) });
                }
                else {
                  if (parseInt(target.value) === 0) {
                    this.setState({ embedColor: 0 });
                  }
                  else {
                    this.setState({ embedColor: this.state.embedColor });
                    message.error("Embed Color Invalid.");
                  }
                }
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button
              disabled={!(this.state.name && this.state.webhook)}
              onClick={this.submit.bind(this)}
              loading={this.state.sending}
              block
            >
              Save
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}
