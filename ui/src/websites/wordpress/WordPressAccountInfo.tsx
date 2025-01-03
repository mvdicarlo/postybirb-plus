// @ts-nocheck

import { Button, Form, Input, message, Radio } from 'antd';
import _ from 'lodash';
import React from 'react';
import { WordpressAccountData } from 'postybirb-commons';
import LoginService from '../../services/login.service';
import { LoginDialogProps } from '../interfaces/website.interface';

export default class WordPressAccountInfo extends React.Component<
  LoginDialogProps,
  WordpressAccountData
> {
  state: WordpressAccountData = {
    username: '',
    app_password: '',
    instance: '',
  };

  constructor(props: LoginDialogProps) {
    super(props);
    this.state = {
      ...this.state,
      ...(props.data as WordpressAccountData)
    };
  }

  async submit() {
    LoginService.setAccountData(this.props.account._id, this.state)
      .then(() => {
        message.success('WordPress login info saved');
      })
      .catch(() => {
        message.error('Failed to save login info');
      });
  }

  render() {
    return (
      <div className="container mt-6">
        <Form layout="vertical">
          <Form.Item
            label="Username"
            help="Your WordPress username."
          >
            <Input
              className="w-full"
              defaultValue={this.state.username}
              onBlur={({ target }) => this.setState({ username: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="App Password"
            help="Your WordPress application password."
          >
            <Input
              className="w-full"
              defaultValue={this.state.app_password}
              onBlur={({ target }) => this.setState({ app_password: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Instance"
            help="The WordPress instance URL."
          >
            <Input
              className="w-full"
              defaultValue={this.state.instance}
              onBlur={({ target }) => this.setState({ instance: target.value })}
            />
          </Form.Item>
          <Form.Item>
            <Button onClick={this.submit.bind(this)} block>
              Save
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}
