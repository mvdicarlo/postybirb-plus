import socket from '../utils/websocket';
import { observable, computed, action } from 'mobx';
import { TagConverter } from '../../../electron-app/src/server/tag-converter/interfaces/tag-converter.interface';
import { Events } from 'postybirb-commons';
import TagConverterService from '../services/tag-converter.service';

export interface TagConverterState {
  tagConverters: TagConverter[];
}

export class TagConverterStore {
  @observable state: TagConverterState = {
    tagConverters: []
  };

  constructor() {
    TagConverterService.getAll().then(({ data }) =>
      this.state.tagConverters.push(...data.sort((a, b) => a.tag.localeCompare(b.tag)))
    );
  }

  @computed
  get converters(): TagConverter[] {
    return this.state.tagConverters;
  }

  @action
  addOrUpdate(group: TagConverter) {
    const index: number = this.state.tagConverters.findIndex(g => g._id === group._id);
    index === -1 ? this.state.tagConverters.push(group) : (this.state.tagConverters[index] = group);
  }

  @action
  remove(id: string) {
    const index: number = this.state.tagConverters.findIndex(g => g._id === id);
    if (index !== -1) this.state.tagConverters.splice(index, 1);
  }
}

export const tagConverterStore = new TagConverterStore();

socket.on(Events.TagConverterEvent.CREATED, (data: TagConverter) => {
  tagConverterStore.addOrUpdate(data);
});

socket.on(Events.TagConverterEvent.UPDATED, (data: TagConverter) => {
  tagConverterStore.addOrUpdate(data);
});

socket.on(Events.TagConverterEvent.REMOVED, (id: string) => {
  tagConverterStore.remove(id);
});
