import socket from '../utils/websocket';
import { observable, computed, action } from 'mobx';
import { TagGroup } from 'postybirb-commons';
import TagGroupService from '../services/tag-group.service';
import { Events } from 'postybirb-commons';

export interface TagGroupState {
  groups: TagGroup[];
}

export class TagGroupStore {
  @observable state: TagGroupState = {
    groups: [],
  };

  constructor() {
    TagGroupService.getAll().then(({ data }) => (this.state.groups = data));
  }

  @computed
  get groups(): TagGroup[] {
    return [...this.state.groups].sort((a, b) => a.alias.localeCompare(b.alias));
  }

  @action
  addOrUpdateTagGroup(group: TagGroup) {
    const index: number = this.state.groups.findIndex(g => g._id === group._id);
    index === -1 ? this.state.groups.push(group) : (this.state.groups[index] = group);
  }

  @action
  removeGroup(id: string) {
    const index: number = this.state.groups.findIndex(g => g._id === id);
    if (index !== -1) this.state.groups.splice(index, 1);
  }
}

export const tagGroupStore = new TagGroupStore();

socket.on(Events.TagGroupEvent.CREATED, (data: TagGroup) => {
  tagGroupStore.addOrUpdateTagGroup(data);
});

socket.on(Events.TagGroupEvent.UPDATED, (data: TagGroup) => {
  tagGroupStore.addOrUpdateTagGroup(data);
});

socket.on(Events.TagGroupEvent.REMOVED, (id: string) => {
  tagGroupStore.removeGroup(id);
});
