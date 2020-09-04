import React from 'react';
import { LoginDialogProps } from '../interfaces/website.interface';
import { Button, Modal, Form, Input, message, Typography } from 'antd';

interface State {
  modalVisible: boolean;
  loginData?: string;
  waiting: boolean;
}

export default class FurryNetworkLoginHelp extends React.Component<LoginDialogProps, State> {
  state: State = {
    modalVisible: false,
    waiting: false
  };

  isValid(): boolean {
    return !!this.state.loginData;
  }

  private attemptTokenInjection() {
    if (this.isValid()) {
      this.setState({ waiting: true });
      const webview: any = document.getElementsByClassName('webview')[0];
      webview
        .executeJavaScript(
          `
            var tokens = ${this.state.loginData!.replace(/("$|^")/g, '')};
            Object.keys(tokens).forEach(key => localStorage.setItem(key, tokens[key]));
          `
        )
        .then(() => {
          message.success('Login token successfully set.');
          webview.reload();
          this.setState({ modalVisible: false });
        })
        .catch(() => {
          message.error('Unable to inject login tokens.');
        })
        .finally(() => {
          this.setState({ waiting: false });
        });
    }
  }

  render() {
    return (
      <span>
        <Button onClick={() => this.setState({ modalVisible: true })}>Alternate Login</Button>
        <Modal
          confirmLoading={this.state.waiting}
          title="FurryNetwork Alternate Login"
          visible={this.state.modalVisible}
          destroyOnClose={true}
          onCancel={() => this.setState({ modalVisible: false })}
          onOk={this.attemptTokenInjection.bind(this)}
          okButtonProps={{ disabled: !this.isValid() }}
        >
          <Form
            onSubmit={e => {
              e.preventDefault();
              this.attemptTokenInjection();
            }}
          >
            <Typography.Title level={4}>How To Login</Typography.Title>
            <ol>
              <li>Open FurryNetwork in your preferred browser</li>
              <li>Login to FurryNetwork</li>
              <li>Press F12 on your keyboard or right click on the screen and select Inspect</li>
              <li>Click on Console tab</li>
              <li>
                <span>Paste in </span>
                <code>
                  <Typography.Text copyable>JSON.stringify(localStorage)</Typography.Text>
                </code>
              </li>
              <li>Press Enter and copy the entire output</li>
              <li>Paste into field below and press OK</li>
            </ol>
            <Input
              required
              autoFocus
              value={this.state.loginData}
              onChange={({ target }) => this.setState({ loginData: target.value })}
            />
          </Form>
        </Modal>
      </span>
    );
  }
}
