import { Badge, Form, Icon, Input, List, message, Modal, Popconfirm, Typography } from 'antd';
import React from 'react';
import LoginService from '../../services/login.service';
import RemoteService from '../../services/remote.service';
import { UserAccountDto } from 'postybirb-commons';
import { Website } from '../../websites/interfaces/website.interface';

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

export default class AccountInfo extends React.Component<AccountInfoProps, AccountInfoState> {
  state: any = {
    modalVisible: false,
    renameVisible: false,
    renameValue: undefined
  };
  showModal = () => this.setState({ modalVisible: true });
  hideModal = () => {
    Object.values(window.electron.auth).forEach(auth => auth.stop());
    this.setState({ modalVisible: false });
    if (RemoteService.isRemote()) {
      RemoteService.updateCookies(this.props.accountInfo._id).finally(() => {
        LoginService.checkLogin(this.props.accountInfo._id);
      });
    } else {
      LoginService.checkLogin(this.props.accountInfo._id);
    }
  };
  clearAccountData = (id: string) => {
    LoginService.clearAccountData(id)
      .then(() => {
        message.success('Cookies and data cleared.');
      })
      .catch(() => {
        message.error('Failed to clear data.');
      });
  };
  deleteAccount = (id: string) => LoginService.deleteAccount(id);
  renameAccount = () => {
    if (this.isRenameValid()) {
      this.setState({ renameVisible: false });
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
    const LoginProps = {
      account: this.props.accountInfo,
      data: this.props.accountInfo.data
    };
    const LoginDialog = this.props.website.LoginDialog(LoginProps);
    return (
      <List.Item
        actions={[
          <span className="text-link" key="action-login" onClick={this.showModal}>
            Login
          </span>,
          <Popconfirm
            title={<div>Are you sure you want to clear cookies and data for this account?</div>}
            onConfirm={() => this.clearAccountData(this.props.accountInfo._id)}
          >
            <span className="text-link" key="action-clear" title="Clear cookies and login data">
              <Typography.Text type="danger">
                <Icon type="disconnect" />
              </Typography.Text>
            </span>
          </Popconfirm>,
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
            <span className="text-link" key="action-delete" title="Delete account profile">
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
                <Typography.Text copyable={{ text: this.props.accountInfo._id}}></Typography.Text>
              </span>
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
                <p>
                  Account ID:{' '}
                  <code>
                    <Typography.Text copyable={{ text: this.props.accountInfo._id }}>
                      {this.props.accountInfo._id}
                    </Typography.Text>
                  </code>
                </p>
                <Form
                  onSubmit={e => {
                    e.preventDefault();
                    this.renameAccount();
                  }}
                >
                  <Input
                    required
                    autoFocus
                    value={this.state.renameValue}
                    onChange={({ target }) => this.setState({ renameValue: target.value })}
                  />
                </Form>
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
          title={
            <div>
              <span className="mr-2">{`${this.props.website.name} - ${this.props.accountInfo.alias}`}</span>
              <span>
                {this.props.website.LoginHelp ? this.props.website.LoginHelp(LoginProps) : null}
              </span>
            </div>
          }
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
