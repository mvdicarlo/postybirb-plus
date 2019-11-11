import { observable, computed, action } from 'mobx';
import axios from '../utils/http';
import { SubmissionDTO } from '../interfaces/submission.interface';
import socket from '../utils/websocket';

export interface SubmissionState {
  loading: boolean;
  submissions: SubmissionDTO[];
}

export class SubmissionStore {
  @observable state: SubmissionState = {
    submissions: [],
    loading: true
  };

  constructor() {
    axios
      .get('/submission')
      .then(({ data }) => {
        this.state.submissions = data || [];
      })
      .finally(() => (this.state.loading = false));
  }

  @computed
  get all(): SubmissionDTO[] {
    return [...this.state.submissions].sort((a, b) => a.order - b.order);
  }

  @computed
  get isLoading(): boolean {
    return this.state.loading;
  }

  @action
  addSubmission(submission: SubmissionDTO) {
    this.state.submissions.push(submission);
  }

  @action removeSubmission(id: string) {
    const index: number = this.state.submissions.findIndex(s => s.id === id);
    if (index !== -1) this.state.submissions.splice(index, 1);
  }

  @action
  setSubmissions(submissions: SubmissionDTO[]) {
    this.state.submissions = submissions || [];
  }
}

export const submissionStore = new SubmissionStore();

socket.on('SUBMISSION REMOVED', (id: string) => {
  submissionStore.removeSubmission(id);
});

socket.on('SUBMISSION CREATED', (data: SubmissionDTO) => {
  submissionStore.addSubmission(data);
});
