import React from 'react';
import { inject, observer } from 'mobx-react';
import { LoginStatusStore } from '../../stores/login-status.store';
import { UIStore } from '../../stores/ui.store';
import { WebsiteRegistry } from '../../website-components/website-registry';
import { Website } from '../../website-components/interfaces/website.interface';
import { UserAccountDto } from '../../../../electron-app/src/account/account.interface';
import LoginService from '../../services/login.service';
import './Login.css';
import {
  List,
  Card,
  Button,
  Modal,
  Input,
  message,
  ConfigProvider,
  Popconfirm,
  Icon,
  Typography,
  Badge
} from 'antd';

interface Props {
  loginStatusStore?: LoginStatusStore;
  uiStore?: UIStore;
}

@inject('loginStatusStore', 'uiStore')
@observer
export class Login extends React.Component<Props> {
  private readonly entries = Object.entries(WebsiteRegistry.websites);

  render() {
    const websitesToDisplay = this.entries.filter(
      ([key, website]) => !this.props.uiStore!.websiteFilter.includes(key)
    );
    return (
      <ConfigProvider renderEmpty={() => <div></div>}>
        <div className="h-100 w-100">
          {websitesToDisplay.map(([key, website]) => (
            <LoginPanel
              key={key}
              website={website}
              accounts={this.props.loginStatusStore!.statuses.filter(
                status => status.website === website.name
              )}
            />
          ))}
        </div>
      </ConfigProvider>
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
        `${this.props.website.name}-${Date.now()}`,
        this.props.website.name,
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
        title={this.props.website.name}
        extra={
          <Button type="primary" onClick={this.showAddAccount}>
            Add Account
          </Button>
        }
      >
        <List
          size="small"
          dataSource={this.props.accounts}
          renderItem={item => <AccountInfo accountInfo={item} website={this.props.website} />}
        />
        <Modal
          visible={this.state.showAddAccount}
          destroyOnClose={true}
          onCancel={this.hideAddAccount}
          onOk={this.createAccount}
          okText="Create"
          closeIcon={false}
          title="Create Account"
        >
          <Input placeholder="Account Alias" maxLength={64} onChange={this.setAccountAlias} />
        </Modal>
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
  hideModal = () => {
    this.setState({ modalVisible: false });
    LoginService.checkLogin(this.props.accountInfo.id);
  };
  deleteAccount = (id: string) => LoginService.deleteAccount(id);

  render() {
    const { accountInfo } = this.props;
    const LoginDialog = this.props.website.LoginDialog({
      account: this.props.accountInfo
    });
    return (
      <List.Item
        actions={[
          <a key="action-login" onClick={this.showModal}>
            Login
          </a>,
          <Popconfirm
            title={
              <div>
                Are you sure you want to delete this account?
                <br />
                This action cannot be undone and the account will be removed from all submissions.
              </div>
            }
            onConfirm={() => this.deleteAccount(this.props.accountInfo.id)}
          >
            <a key="action-delete">
              <Typography.Text type="danger">
                <Icon type="delete" />
              </Typography.Text>
            </a>
          </Popconfirm>
        ]}
      >
        <List.Item.Meta title={accountInfo.alias} />
        <span>
          <Badge
            status={accountInfo.loggedIn ? 'success' : 'error'}
            text={accountInfo.username || 'Not logged in'}
          />
        </span>
        <Modal
          title={`${this.props.website.name} - ${this.props.accountInfo.alias}`}
          visible={this.state.modalVisible}
          destroyOnClose={true}
          footer={null}
          onCancel={this.hideModal}
          wrapClassName="login-modal"
          mask={false}
        >
          {LoginDialog}
        </Modal>
      </List.Item>
    );
  }
}
