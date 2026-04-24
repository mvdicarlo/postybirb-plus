import { Button, Form, Input, message, Spin } from 'antd';
import Axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom';
import { MissKeyAccountData } from 'postybirb-commons';
import LoginService from '../../services/login.service';
import { LoginDialogProps } from '../interfaces/website.interface';
import * as Misskey from 'misskey-js';

interface State extends MissKeyAccountData {
  code: string;
  sessionId: string;
  loading: boolean;
}

export default class MissKeyLogin extends React.Component<LoginDialogProps, State> {
  state: State = {
    website: 'misskey.io',
    code: '',
    loading: true,
    sessionId: '',
    token: null,
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
    // Generate a unique session ID for MiAuth
    const sessionId = `postybirb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.setState({ sessionId });
    
    // Construct MiAuth URL - Misskey's authentication system
    const authUrl = `https://${website}/miauth/${sessionId}?name=PostyBirb&permission=write:notes,write:drive`;
    this.view.src = authUrl;
  }

  async submit() {
    if (!this.state.sessionId) {
      message.error('Invalid session. Please try again.');
      return;
    }

    try {
      // Check MiAuth session
      const response = await Axios.post(`https://${this.state.website}/api/miauth/${this.state.sessionId}/check`);
      
      if (response.data.ok && response.data.token) {
        // Create API client to get username
        const cli = new Misskey.api.APIClient({
          origin: `https://${this.state.website}`,
          credential: response.data.token,
        });
        
        const userInfo = await cli.request('i', {});
        
        this.setState({ 
          token: response.data.token,
          username: userInfo.username 
        });
        
        await LoginService.setAccountData(this.props.account._id, {
          website: this.state.website,
          token: response.data.token,
          username: userInfo.username
        });
        
        message.success(`${this.state.website} authenticated successfully!`);
      } else {
        message.error('Authentication not completed. Please authorize in the browser first.');
      }
    } catch (err: any) {
      console.error('MissKey authentication error:', err);
      message.error(`Failed to authenticate ${this.state.website}: ${err.message}`);
    }
  }

  isValid(): boolean {
    return !!this.state.website && !!this.state.sessionId;
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
                  this.getAuthURL(website);
                  this.setState({ website });
                }}
              />
            </Form.Item>
            <Form.Item 
              label="Status" 
              help="Authorize PostyBirb in the window above, then click Check Authorization">
              <Button 
                type="primary" 
                onClick={this.submit.bind(this)} 
                disabled={!this.isValid()}
                block>
                Check Authorization
              </Button>
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
