import { observable, computed, action } from 'mobx';
import socket from '../utils/websocket';
import { UserAccountDto } from '../../../electron-app/src/server/account/interfaces/user-account.dto.interface';
import LoginService from '../services/login.service';
import { AccountEvent } from '../shared/enums/account.events.enum';

export interface LoginStatusState {
  statuses: UserAccountDto[];
}

export class LoginStatusStore {
  @observable state: LoginStatusState = {
    statuses: []
  };

  constructor() {
    LoginService.getStatuses().then(statuses => (this.state.statuses = statuses || []));
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
    return (this.state.statuses.find(s => s._id === id) || {}).alias || id;
  }

  getWebsiteForAccountId(id: string): string {
    return (this.state.statuses.find(s => s._id === id) || {}).website || id;
  }

  getWebsiteLoginStatusForAccountId(id: string): boolean {
    return (this.state.statuses.find(s => s._id === id) || {}).loggedIn || false;
  }

  hasLoggedInAccounts(website: string): boolean {
    return !!this.statuses.filter(status => status.website === website && status.loggedIn).length;
  }

  accountExists(accountId: string): boolean {
    return !!this.state.statuses.find(s => s._id === accountId);
  }
}

export const loginStatusStore = new LoginStatusStore();

socket.on(AccountEvent.STATUS_UPDATED, (data: UserAccountDto[]) =>
  loginStatusStore.updateStatuses(data)
);
