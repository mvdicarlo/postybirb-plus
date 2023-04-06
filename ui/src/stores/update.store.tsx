import { notification } from 'antd';
import { action, observable } from 'mobx';
import React from 'react';
import UpdateService from '../services/update.service';
import { Events } from 'postybirb-commons';
import socket from '../utils/websocket';

interface UpdateState {
  available: boolean;
  error: string;
  isUpdating: boolean;
  percent: number;
  releaseNotes: string;
  version: string;
}

export class UpdateStore {
  @observable state: UpdateState = {
    available: false,
    error: '',
    percent: 0,
    releaseNotes: '',
    isUpdating: false,
    version: ''
  };

  constructor() {
    UpdateService.getUpdateData().then(data => {
      if (data) {
        Object.assign(this.state, data);
      }
    });
  }

  @action
  updateAvailable(data: UpdateState) {
    Object.assign(this.state, data);
  }

  @action
  setError(err: any) {
    this.state.error = err || '';
  }
}

export const updateStore = new UpdateStore();

socket.on(Events.UpdateEvent.AVAILABLE, (data: UpdateState) => updateStore.updateAvailable(data));

socket.on(Events.UpdateEvent.ERROR, (err: any) => {
  updateStore.setError(err);
  notification.error({
    message: 'PostyFox Update Failed',
    description: (
      <div>
        <div className="mb-6">
          PostyFox Failed to Update.
          <br />
          It is suggested that you go to the website and update using the latest download.
        </div>
        <div>{err.code}</div>
      </div>
    ),
  });
});

socket.on(Events.UpdateEvent.BLOCKED, () => {
  notification.warning({
    message: 'PostyFox Update Stopped',
    description: 'PostyFox could not update because it is currently posting.'
  });
});
