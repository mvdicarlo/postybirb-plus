import socket from '../utils/websocket';
import { observable, action } from 'mobx';
import UpdateService from '../services/update.service';
import { notification } from 'antd';
import React from 'react';

enum UpdateEvent {
  AVAILABLE = '[UPDATE] AVAILABLE',
  BLOCKED = '[UPDATE] BLOCKED RESTART',
  ERROR = '[UPDATE] ERROR',
  PROGRESS = '[UPDATE] PROGRESS',
  UPDATING = '[UPDATE] UPDATING'
}

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
  updateAvailable(data: any) {
    Object.assign(this.state, data);
  }

  @action
  setError(err: any) {
    this.state.error = err || '';
  }

  @action
  setPercent(percent: number) {
    this.state.percent = percent || 0;
  }

  @action
  setUpdating(isUpdating: boolean) {
    this.state.isUpdating = isUpdating;
  }
}

export const updateStore = new UpdateStore();

socket.on(UpdateEvent.AVAILABLE, (data: any) => updateStore.updateAvailable(data));

socket.on(UpdateEvent.PROGRESS, (percent: number) => updateStore.setPercent(percent));

socket.on(UpdateEvent.ERROR, (err: string) => {
  updateStore.setError(err);
  notification.error({
    message: 'PostyBirb Update Failed',
    description: (
      <div>
        <div className="mb-6">
          PostyBirb Failed to Update.
          <br />
          It is suggested that you go to the website and update using the latest download.
        </div>
        <div>{err}</div>
      </div>
    )
  });
});

socket.on(UpdateEvent.UPDATING, (isUpdating: boolean) => updateStore.setUpdating(isUpdating));

socket.on(UpdateEvent.BLOCKED, () => {
  notification.warning({
    message: 'PostyBirb Update Stopped',
    description: 'PostyBirb could not update because it is currently posting.'
  });
});
