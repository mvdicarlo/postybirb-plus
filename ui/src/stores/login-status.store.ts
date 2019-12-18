import { observable, computed, action } from 'mobx';
import socket from '../utils/websocket';
import axios from '../utils/http';
import { UserAccountDto } from '../../../electron-app/src/account/account.interface';

export enum AccountEvent {
  CREATED = '[ACCOUNT] CREATED',
  DELETED = '[ACCOUNT] DELETED',
  UPDATED = '[ACCOUNTS] UPDATED',
  STATUS_UPDATED = '[ACCOUNTS] STATUS UPDATED'
}

export interface LoginStatusState {
  statuses: UserAccountDto[];
}

export class LoginStatusStore {
  @observable state: LoginStatusState = {
    statuses: []
  };

  constructor() {
    axios.get('/account/loginStatuses').then(({ data }) => {
      this.state.statuses = data || [];
    });
  }

  @computed
  get statuses(): UserAccountDto[] {
    return [...this.state.statuses];
  }

  @action
  updateStatuses(statuses: UserAccountDto[]) {
    this.state.statuses = statuses || [];
  }

  getAliasForAccountId(id: string): string {
    return (this.state.statuses.find(s => s.id === id) || {}).alias || id;
  }

  getWebsiteForAccountId(id: string): string {
    return (this.state.statuses.find(s => s.id === id) || {}).website || id;
  }

  getWebsiteLoginStatusForAccountId(id: string): boolean {
    return (this.state.statuses.find(s => s.id === id) || {}).loggedIn || false;
  }

  hasLoggedInAccounts(website: string): boolean {
    return !!this.statuses.filter(status => status.website === website && status.loggedIn).length;
  }

  accountExists(accountId: string): boolean {
    return !!this.state.statuses.find(s => s.id === accountId);
  }
}

export const loginStatusStore = new LoginStatusStore();

socket.on(AccountEvent.STATUS_UPDATED, (data: UserAccountDto[]) =>
  loginStatusStore.updateStatuses(data)
);
