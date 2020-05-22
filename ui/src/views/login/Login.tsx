import { Button, Card, Form, Input, List, message, Modal } from 'antd';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { UserAccountDto } from '../../../../electron-app/src/account/interfaces/user-account.dto.interface';
import LoginService from '../../services/login.service';
import { LoginStatusStore } from '../../stores/login-status.store';
import { UIStore } from '../../stores/ui.store';
import { Website } from '../../websites/interfaces/website.interface';
import { WebsiteRegistry } from '../../websites/website-registry';
import AccountInfo from './AccountInfo';
import './Login.css';

interface Props {
  loginStatusStore?: LoginStatusStore;
  uiStore?: UIStore;
}

@inject('loginStatusStore', 'uiStore')
@observer
export class Login extends React.Component<Props> {
  private readonly entries = Object.entries(WebsiteRegistry.websites);

  render() {
    const websitesToDisplay = this.entries
      .filter(([key, website]) => !this.props.uiStore!.websiteFilter.includes(key))
      .sort((a, b) => {
        const aLoggedIn = this.props.loginStatusStore!.hasLoggedInAccounts(a[0]);
        const bLoggedIn = this.props.loginStatusStore!.hasLoggedInAccounts(b[0]);

        if (aLoggedIn === bLoggedIn) {
          return a[1].name.localeCompare(b[1].name);
        } else {
          if (aLoggedIn && !bLoggedIn) return -1;
          else return 1;
        }
      });

    return (
      <div className="h-100 w-100">
        {websitesToDisplay.map(([key, website]) => (
          <LoginPanel
            key={key}
            website={website}
            accounts={this.props.loginStatusStore!.statuses.filter(
              status => status.website === website.internalName
            )}
          />
        ))}
      </div>
    );
  }
}

interface LoginPanelProps {
  website: Website;
  accounts: UserAccountDto[];
}

interface LoginPanelState {
  showAddAccount: boolean;
  newAccountAlias: string;
}

class LoginPanel extends React.Component<LoginPanelProps, LoginPanelState> {
  state: any = {
    showAddAccount: false,
    newAccountAlias: ''
  };

  setAccountAlias = ({ target }: { target: HTMLInputElement }) =>
    this.setState({ newAccountAlias: target.value });
  showAddAccount = () => this.setState({ showAddAccount: true, newAccountAlias: '' });
  hideAddAccount = () => this.setState({ showAddAccount: false });
  createAccount = () => {
    if (this.state.newAccountAlias && this.state.newAccountAlias.trim()) {
      LoginService.createAccount(
        `${this.props.website.internalName}-${Date.now()}`,
        this.props.website.internalName,
        this.state.newAccountAlias
      )
        .then(() => message.success('Account created'))
        .catch(() => message.error('Unable to create account'));
      this.hideAddAccount();
    }
  };

  render() {
    return (
      <Card
        size="small"
        className="login-card"
        title={
          <span
            className={`font-bold text-${
              this.props.accounts.find(a => a.loggedIn) ? 'success' : 'danger'
            }`}
          >
            {this.props.website.name}
          </span>
        }
        extra={
          <Button type="link" onClick={this.showAddAccount}>
            Add Account
          </Button>
        }
      >
        <List
          size="small"
          dataSource={this.props.accounts}
          renderItem={item => (
            <AccountInfo accountInfo={item} data={item.data} website={this.props.website} />
          )}
        />
        <Modal
          visible={this.state.showAddAccount}
          destroyOnClose={true}
          onCancel={this.hideAddAccount}
          onOk={this.createAccount}
          okText="Add"
          closeIcon={false}
          title="Add Account"
        >
          <Form
            onSubmit={e => {
              e.preventDefault();
              this.createAccount();
            }}
          >
            <Input
              autoFocus
              required
              placeholder="Account Alias"
              maxLength={64}
              onChange={this.setAccountAlias}
            />
          </Form>
        </Modal>
      </Card>
    );
  }
}
