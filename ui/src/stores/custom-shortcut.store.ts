import socket from '../utils/websocket';
import { observable, computed, action } from 'mobx';
import { CustomShortcut } from '../../../electron-app/src/server/custom-shortcut/interfaces/custom-shortcut.interface';
import CustomShortcutService from '../services/custom-shortcut.service';
import { Events } from 'postybirb-commons';

export interface CustomShortcutState {
  shortcuts: CustomShortcut[];
}

export class CustomShortcutStore {
  @observable state: CustomShortcutState = {
    shortcuts: []
  };

  constructor() {
    CustomShortcutService.getAll().then(({ data }) =>
      this.state.shortcuts.push(...data.sort((a, b) => a.shortcut.localeCompare(b.shortcut)))
    );
  }

  @computed
  get shortcuts(): CustomShortcut[] {
    return this.state.shortcuts;
  }

  @action
  addOrUpdate(group: CustomShortcut) {
    const index: number = this.state.shortcuts.findIndex(g => g._id === group._id);
    index === -1 ? this.state.shortcuts.push(group) : (this.state.shortcuts[index] = group);
  }

  @action
  remove(id: string) {
    const index: number = this.state.shortcuts.findIndex(g => g._id === id);
    if (index !== -1) this.state.shortcuts.splice(index, 1);
  }
}

export const customShortcutStore = new CustomShortcutStore();

socket.on(Events.CustomShortcutEvent.CREATED, (data: CustomShortcut) => {
  customShortcutStore.addOrUpdate(data);
});

socket.on(Events.CustomShortcutEvent.UPDATED, (data: CustomShortcut) => {
  customShortcutStore.addOrUpdate(data);
});

socket.on(Events.CustomShortcutEvent.REMOVED, (id: string) => {
  customShortcutStore.remove(id);
});
