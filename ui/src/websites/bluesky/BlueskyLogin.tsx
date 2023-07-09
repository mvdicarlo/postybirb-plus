import { Button, Form, Input, message, Spin } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom';
import { BlueskyAccountData } from 'postybirb-commons';
import LoginService from '../../services/login.service';
import { LoginDialogProps } from '../interfaces/website.interface';
import { BskyAgent } from '@atproto/api';

interface State extends BlueskyAccountData {
  loading: boolean;
}

export default class BlueskyLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    username: '',
    password: '',
    loading: true
  };

  private view: any;

  constructor(props: LoginDialogProps) {
    super(props);
    this.state = {
      ...this.state,
      ...(props.data as State)
    };
  }




  submit() {
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    
    agent.login({
      identifier: this.state.username,
      password: this.state.password,
    }).then(res => {
      if (res.success) { 
        LoginService.setAccountData(this.props.account._id, this.state).then(
            () => {
              message.success(`Details confirmed and saved`);
            }
          );
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
            <Form.Item label="Username" help="Your username or instance id" required>
              <Input
                value={this.state.username}
                onChange={({ target }) => this.setState({ username: target.value })}
              />
            </Form.Item>
            <Form.Item label="Password" help="An *app* password - you can one of these in Settings" required>
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
