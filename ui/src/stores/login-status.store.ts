import { observable, computed, action } from 'mobx';
import socket from '../utils/websocket';
import axios from '../utils/http';
import { UserAccountDto } from '../interfaces/user-account.interface';

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
}

export const loginStatusStore = new LoginStatusStore();

socket.on('ACCOUNTS STATUS UPDATED', (data: UserAccountDto[]) =>
  loginStatusStore.updateStatuses(data)
);
