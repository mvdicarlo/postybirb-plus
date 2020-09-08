import socket from '../utils/websocket';
import { observable, computed, action } from 'mobx';
import { DescriptionTemplate } from '../../../electron-app/src/server/description-template/interfaces/description-template.interface';
import DescriptionTemplateService from '../services/description-template.service';
import { Events } from 'postybirb-commons';

export interface DescriptionTemplateState {
  templates: DescriptionTemplate[];
}

export class DescriptionTemplateStore {
  @observable state: DescriptionTemplateState = {
    templates: []
  };

  constructor() {
    DescriptionTemplateService.getAll().then(({ data }) => (this.state.templates.push(...data.sort((a, b) => a.title.localeCompare(b.title)))));
  }

  @computed
  get templates(): DescriptionTemplate[] {
    return this.state.templates;
  }

  @action
  addOrUpdate(group: DescriptionTemplate) {
    const index: number = this.state.templates.findIndex(g => g._id === group._id);
    index === -1 ? this.state.templates.push(group) : (this.state.templates[index] = group);
  }

  @action
  remove(id: string) {
    const index: number = this.state.templates.findIndex(g => g._id === id);
    if (index !== -1) this.state.templates.splice(index, 1);
  }
}

export const descriptionTemplateStore = new DescriptionTemplateStore();

socket.on(Events.DescriptionTemplateEvent.CREATED, (data: DescriptionTemplate) => {
  descriptionTemplateStore.addOrUpdate(data);
});

socket.on(Events.DescriptionTemplateEvent.UPDATED, (data: DescriptionTemplate) => {
  descriptionTemplateStore.addOrUpdate(data);
});

socket.on(Events.DescriptionTemplateEvent.REMOVED, (id: string) => {
  descriptionTemplateStore.remove(id);
});
