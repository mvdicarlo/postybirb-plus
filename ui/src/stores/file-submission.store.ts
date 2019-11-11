import { observable, computed, action } from 'mobx';
import axios from '../utils/http';
import { FileSubmissionDTO } from '../interfaces/submission.interface';
import socket from '../utils/websocket';

export interface FileSubmissionState {
  loading: boolean;
  submissions: FileSubmissionDTO[];
}

export class SubmissionStore {
  @observable state: FileSubmissionState = {
    submissions: [],
    loading: true
  };

  constructor() {
    axios
      .get('/file_submission')
      .then(({ data }) => {
        this.state.submissions = data || [];
      })
      .finally(() => (this.state.loading = false));
  }

  @computed
  get all(): FileSubmissionDTO[] {
    return [...this.state.submissions].sort((a, b) => a.order - b.order);
  }

  @computed
  get isLoading(): boolean {
    return this.state.loading;
  }

  @action
  addSubmission(submission: FileSubmissionDTO) {
    this.state.submissions.push(submission);
  }

  @action removeSubmission(id: string) {
    const index: number = this.state.submissions.findIndex(s => s.id === id);
    if (index !== -1) this.state.submissions.splice(index, 1);
  }

  @action
  setSubmissions(submissions: FileSubmissionDTO[]) {
    this.state.submissions = submissions || [];
  }
}

export const submissionStore = new SubmissionStore();

socket.on('FILE SUBMISSION REMOVED', (id: string) => {
  submissionStore.removeSubmission(id);
});

socket.on('FILE SUBMISSION CREATED', (data: FileSubmissionDTO) => {
  submissionStore.addSubmission(data);
});
