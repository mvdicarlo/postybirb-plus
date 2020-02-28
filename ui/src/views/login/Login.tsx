import React from 'react';
import { inject, observer } from 'mobx-react';
import { LoginStatusStore } from '../../stores/login-status.store';
import { UIStore } from '../../stores/ui.store';
import { WebsiteRegistry } from '../../website-components/website-registry';
import { Website } from '../../website-components/interfaces/website.interface';
import { UserAccountDto } from '../../../../electron-app/src/account/interfaces/user-account.dto.interface';
import LoginService from '../../services/login.service';
import './Login.css';
import {
  List,
  Card,
  Button,
  Modal,
  Input,
  message,
  Popconfirm,
  Icon,
  Typography,
  Badge
} from 'antd';
import RemoteService from '../../services/remote.service';

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
        className="login-card"
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
          renderItem={item => (
            <AccountInfo accountInfo={item} data={item.data} website={this.props.website} />
          )}
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
  data: any;
  website: Website;
}

interface AccountInfoState {
  modalVisible: boolean;
  renameVisible: boolean;
  renameValue?: string;
}

class AccountInfo extends React.Component<AccountInfoProps, AccountInfoState> {
  state: any = {
    modalVisible: false,
    renameVisible: false,
    renameValue: undefined
  };

  showModal = () => this.setState({ modalVisible: true });
  hideModal = () => {
    this.setState({ modalVisible: false });
    if (RemoteService.isRemote()) {
      RemoteService.updateCookies(this.props.accountInfo._id).finally(() => {
        LoginService.checkLogin(this.props.accountInfo._id);
      });
    } else {
      LoginService.checkLogin(this.props.accountInfo._id);
    }
  };

  deleteAccount = (id: string) => LoginService.deleteAccount(id);

  renameAccount = () => {
    this.setState({ renameVisible: false });
    if (this.isRenameValid()) {
      LoginService.renameAccount(this.props.accountInfo._id, this.state.renameValue.trim())
        .then(() => {
          message.success('Account name updated.');
        })
        .catch(() => {
          message.error('Failed to update account name.');
        });
    } else {
      message.error('Account cannot be given an empty name.');
    }
  };

  isRenameValid(): boolean {
    if (!this.state.renameValue) {
      return false;
    }

    if (!this.state.renameValue.trim()) {
      return false;
    }

    return true;
  }

  render() {
    const { accountInfo } = this.props;
    const LoginDialog = this.props.website.LoginDialog({
      account: this.props.accountInfo,
      data: this.props.accountInfo.data
    });
    return (
      <List.Item
        actions={[
          <span className="text-link" key="action-login" onClick={this.showModal}>
            Login
          </span>,
          <Popconfirm
            title={
              <div>
                Are you sure you want to delete this account?
                <br />
                This action cannot be undone and the account will be removed from all submissions.
              </div>
            }
            onConfirm={() => this.deleteAccount(this.props.accountInfo._id)}
          >
            <span className="text-link" key="action-delete">
              <Typography.Text type="danger">
                <Icon type="delete" />
              </Typography.Text>
            </span>
          </Popconfirm>
        ]}
      >
        <List.Item.Meta
          title={
            <div>
              {accountInfo.alias}
              <span className="text-link ml-1">
                <Icon
                  type="edit"
                  onClick={() =>
                    this.setState({ renameVisible: true, renameValue: accountInfo.alias })
                  }
                />
              </span>
              <Modal
                title="Rename"
                visible={this.state.renameVisible}
                destroyOnClose={true}
                onCancel={() => this.setState({ renameVisible: false })}
                onOk={this.renameAccount}
                okButtonProps={{ disabled: !this.isRenameValid() }}
              >
                <Input
                  value={this.state.renameValue}
                  onChange={({ target }) => this.setState({ renameValue: target.value })}
                />
              </Modal>
            </div>
          }
        />
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
          wrapClassName="fullscreen-modal"
          mask={false}
        >
          {LoginDialog}
        </Modal>
      </List.Item>
    );
  }
}
