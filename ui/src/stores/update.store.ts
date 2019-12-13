import socket from '../utils/websocket';
import { observable, action } from 'mobx';
import UpdateService from '../services/update.service';
import { notification } from 'antd';

enum UpdateEvent {
  AVAILABLE = '[UPDATE] AVAILABLE',
  BLOCKED = '[UPDATE] BLOCKED RESTART',
  ERROR = '[UPDATE] ERROR',
  PROGRESS = '[UPDATE] PROGRESS'
}

interface UpdateState {
  percent: number;
  releaseNotes: string;
  available: boolean;
  error: string;
}

export class UpdateStore {
  @observable state: UpdateState = {
    available: false,
    error: '',
    percent: 0,
    releaseNotes: ''
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
    Object.assign(this.state, {
      ...data,
      percent: 0,
      error: ''
    });
  }

  @action
  setError(err: any) {
    this.state.error = err || '';
  }

  @action
  setPercent(percent: number) {
    this.state.percent = percent || 0;
  }
}

export const updateStore = new UpdateStore();

socket.on(UpdateEvent.AVAILABLE, (data: any) => updateStore.updateAvailable(data));

socket.on(UpdateEvent.PROGRESS, (percent: number) => updateStore.setPercent(percent));

socket.on(UpdateEvent.ERROR, (err: string) => updateStore.setError(err));

socket.on(UpdateEvent.BLOCKED, () => {
  notification.warning({
    message: 'PostyBirb Update Stopped',
    description: 'PostyBirb could not update because it is currently posting.'
  });
});
