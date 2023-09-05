import { observable, computed, action } from 'mobx';
import socket from '../utils/websocket';
import { PostStatuses, PostInfo } from 'postybirb-commons';
import PostService from '../services/post.service';
import { Submission } from 'postybirb-commons';
import { Events } from 'postybirb-commons';

export class PostStatusStore {
  @observable
  state: PostStatuses = {
    queued: [],
    posting: [],
  };

  constructor() {
    PostService.getStatus().then(status => Object.assign(this.state, status));
  }

  @computed
  get queued(): Submission[] {
    return [...this.state.queued];
  }

  @computed
  get posting(): PostInfo[] {
    return [...this.state.posting];
  }

  @action
  updateStatus(status: PostStatuses) {
    Object.assign(this.state, status);
  }
}

export const postStatusStore = new PostStatusStore();

socket.on(Events.PostEvent.UPDATED, (data: PostStatuses) => postStatusStore.updateStatus(data));
