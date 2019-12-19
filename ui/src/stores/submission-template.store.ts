import socket from '../utils/websocket';
import { observable, computed, action } from 'mobx';
import SubmissionTemplateService from '../services/submission-template.service';
import { SubmissionTemplate } from '../../../electron-app/src/submission/submission-template/submission-template.interface';
import { SubmissionTemplateEvent } from '../shared/enums/submission-template.events.enum';

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
    const index: number = this.state.templates.findIndex(s => s.id === template.id);
    if (index === -1) {
      this.state.templates.push(template);
    } else {
      this.state.templates[index] = template;
    }
  }

  @action
  remove(id: string) {
    const index: number = this.state.templates.findIndex(s => s.id === id);
    if (index !== -1) this.state.templates.splice(index, 1);
  }

  getSubmissionTemplate(id: string): SubmissionTemplate | undefined {
    return this.state.templates.find(t => t.id === id);
  }
}

export const submissionTemplateStore = new SubmissionTemplateStore();

socket.on(SubmissionTemplateEvent.REMOVED, (id: string) => {
  submissionTemplateStore.remove(id);
});

socket.on(SubmissionTemplateEvent.UPDATED, (data: SubmissionTemplate) => {
  submissionTemplateStore.addOrUpdate(data);
});

socket.on(SubmissionTemplateEvent.CREATED, (data: SubmissionTemplate) => {
  submissionTemplateStore.addOrUpdate(data);
});
