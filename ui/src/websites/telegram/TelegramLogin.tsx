import { Button, Form, Icon, Input, message, Modal } from 'antd';
import { TelegramAccountData } from 'postybirb-commons';
import React from 'react';
import BrowserLink from '../../components/BrowserLink';
import LoginService from '../../services/login.service';
import WebsiteService from '../../services/website.service';
import { LoginDialogProps } from '../interfaces/website.interface';

interface State extends TelegramAccountData {
  code: string;
  sending: boolean;
  displayCodeDialog: boolean;
}

export default class TelegramLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    phoneNumber: '',
    appHash: '',
    appId: '',
    code: '',
    sending: false,
    displayCodeDialog: false
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
    if (this.isValid()) {
      LoginService.setAccountData(this.props.account._id, {
        appHash: this.state.appHash,
        appId: this.state.appId,
        phoneNumber: this.state.phoneNumber
      })
        .then(() => {
          this.setState({ displayCodeDialog: true });
          WebsiteService.postCustomRoute(this.props.account.website, 'startAuthentication', {
            appId: this.state.appId,
            phoneNumber: this.state.phoneNumber,
            appHash: this.state.appHash
          })
            .catch(() => {
              message.error('Failed to begin authentication.');
              this.setState({ displayCodeDialog: false });
            })
            .finally(() => this.setState({ sending: false }));
        })
        .catch(() => {
          message.error('Failed to login to set account data.');
        })
        .finally(() => this.setState({ sending: false }));
    }
  }

  isValid(): boolean {
    return !!this.state.appId && !!this.state.appHash && !!this.state.phoneNumber;
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
          <Form.Item
            label="App Id"
            required
            extra={
              <div>
                <BrowserLink url="https://core.telegram.org/myapp">
                  You must create you own app configuration <Icon type="link" />
                </BrowserLink>
              </div>
            }
          >
            <Input
              className="w-full"
              value={this.state.appId}
              onChange={({ target }) => this.setState({ appId: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="App Hash"
            required
            extra={
              <div>
                <BrowserLink url="https://core.telegram.org/myapp">
                  You must create your own app configuration <Icon type="link" />
                </BrowserLink>
              </div>
            }
          >
            <Input
              type="password"
              className="w-full"
              value={this.state.appHash}
              onChange={({ target }) => this.setState({ appHash: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Phone Number (International Format)"
            required
            extra={
              <div>
                <BrowserLink url="https://developers.omnisend.com/guides/e164-phone-number-formatting">
                  Phone number must be in international format <Icon type="link" />
                </BrowserLink>
              </div>
            }
          >
            <Input
              className="w-full"
              value={this.state.phoneNumber}
              onChange={({ target }) =>
                this.setState({ phoneNumber: target.value.replace(/[^0-9+]/g, '') })
              }
            />
          </Form.Item>
          <Form.Item>
            <Button
              disabled={!this.isValid()}
              onClick={this.submit.bind(this)}
              loading={this.state.sending}
              block
            >
              Authenticate
            </Button>
          </Form.Item>
        </Form>
        <Modal
          visible={this.state.displayCodeDialog}
          title="Authentication Code"
          onCancel={() => this.setState({ displayCodeDialog: false })}
          onOk={() => {
            if (!this.state.code) {
              message.error('Please provide authentication code from Telegram.');
              return;
            }

            WebsiteService.postCustomRoute<{ result: boolean; message?: string }>(
              this.props.account.website,
              'authenticate',
              {
                appId: this.state.appId,
                code: this.state.code
              }
            )
              .then(res => {
                if (res.result) {
                  message.success('Telegram authenticated.');
                  this.setState({ displayCodeDialog: false });
                } else {
                  message.error(res.message || 'Failed to authenticate Telegram.');
                }
              })
              .catch(() => {
                message.error('Problem occurred when trying to authenticate.');
              });
          }}
        >
          <Form layout="vertical">
            <Form.Item label="Code" required>
              <Input
                autoFocus
                className="w-full"
                value={this.state.code}
                onChange={({ target }) => this.setState({ code: target.value })}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}
