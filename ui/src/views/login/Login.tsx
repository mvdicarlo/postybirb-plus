import React from 'react';
import { inject, observer } from 'mobx-react';
import { LoginStatusStore } from '../../stores/login-status.store';
import { WebsiteRegistry } from '../../website-components/website-registry';
import { Website } from '../../website-components/interfaces/website.interface';
import { List, Card, Button, Modal } from 'antd';
import { UserAccountDto } from '../../interfaces/user-account.interface';

interface Props {
  loginStatusStore?: LoginStatusStore;
}

@inject('loginStatusStore')
@observer
export class Login extends React.Component<any | Props> {
  private readonly entries = Object.entries(WebsiteRegistry.websites);

  render() {
    return (
      <div className="h-100 w-100">
        {this.entries.map(([key, website]) => (
          <LoginPanel
            key={key}
            website={website}
            accounts={this.props.loginStatusStore.statuses.filter(
              status => status.website === website.name
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
}

class LoginPanel extends React.Component<LoginPanelProps, LoginPanelState> {
  state: any = {
    showAddAccount: false
  };

  showAddAccount = () => this.setState({ showAddAccount: true });

  render() {
    return (
      <Card
        size="small"
        title={this.props.website.name}
        extra={<Button onClick={this.showAddAccount}>Add Account</Button>}
      >
        <List
          size="small"
          dataSource={this.props.accounts}
          renderItem={item => (
            <AccountInfo accountInfo={item} website={this.props.website} />
          )}
        />
      </Card>
    );
  }
}

interface AccountInfoProps {
  accountInfo: UserAccountDto;
  website: Website;
}

interface AccountInfoState {
  modalVisible: boolean;
}

class AccountInfo extends React.Component<AccountInfoProps, AccountInfoState> {
  state: any = {
    modalVisible: false
  };

  showModal = () => this.setState({ modalVisible: true });
  hideModal = () => this.setState({ modalVisible: false });

  render() {
    const { accountInfo } = this.props;
    const LoginDialog = this.props.website.LoginDialog({
      account: this.props.accountInfo
    });
    return (
      <List.Item
        actions={[
          <a key="action-login" onClick={this.showModal}>
            login
          </a>,
          <a key="action-delete">delete</a>
        ]}
      >
        <List.Item.Meta title={accountInfo.alias} />
        <span>
          {accountInfo.loggedIn ? accountInfo.username : 'Not logged in'}
        </span>
        <Modal
          title={`${this.props.website.name} - ${this.props.accountInfo.alias}`}
          visible={this.state.modalVisible}
          destroyOnClose={true}
          closable={true}
          footer={null}
          onCancel={this.hideModal}
        >
          {LoginDialog}
        </Modal>
      </List.Item>
    );
  }
}
