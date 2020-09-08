import socket from '../utils/websocket';
import { observable, computed, action } from 'mobx';
import SubmissionTemplateService from '../services/submission-template.service';
import { SubmissionTemplate } from '../../../electron-app/src/server/submission/submission-template/interfaces/submission-template.interface';
import { Events } from 'postybirb-commons';

export interface SubmissionStoreState {
  loading: boolean;
  templates: SubmissionTemplate[];
}

export class SubmissionTemplateStore {
  @observable state: SubmissionStoreState = {
    templates: [],
    loading: true
  };

  constructor() {
    SubmissionTemplateService.getTemplates()
      .then(data => {
        this.state.templates = data || [];
      })
      .finally(() => (this.state.loading = false));
  }

  @computed
  get all(): SubmissionTemplate[] {
    return [...this.state.templates].sort((a, b) => a.alias.localeCompare(b.alias));
  }

  @computed
  get isLoading(): boolean {
    return this.state.loading;
  }

  @action
  addOrUpdate(template: SubmissionTemplate) {
    const index: number = this.state.templates.findIndex(s => s._id === template._id);
    if (index === -1) {
      this.state.templates.push(template);
    } else {
      this.state.templates[index] = template;
    }
  }

  @action
  remove(id: string) {
    const index: number = this.state.templates.findIndex(s => s._id === id);
    if (index !== -1) this.state.templates.splice(index, 1);
  }

  getSubmissionTemplate(id: string): SubmissionTemplate | undefined {
    return this.state.templates.find(t => t._id === id);
  }
}

export const submissionTemplateStore = new SubmissionTemplateStore();

socket.on(Events.SubmissionTemplateEvent.REMOVED, (id: string) => {
  submissionTemplateStore.remove(id);
});

socket.on(Events.SubmissionTemplateEvent.UPDATED, (data: SubmissionTemplate) => {
  submissionTemplateStore.addOrUpdate(data);
});

socket.on(Events.SubmissionTemplateEvent.CREATED, (data: SubmissionTemplate) => {
  submissionTemplateStore.addOrUpdate(data);
});
