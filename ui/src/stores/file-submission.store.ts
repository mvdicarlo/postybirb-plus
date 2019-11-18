import axios from '../utils/http';
import socket from '../utils/websocket';
import { FileSubmission } from '../../../electron-app/src/submission/file-submission/file-submission.interface';
import { SubmissionPackage } from '../../../electron-app/src/submission/interfaces/submission-package.interface';
import { observable, computed, action } from 'mobx';

export interface FileSubmissionState {
  loading: boolean;
  submissions: SubmissionPackage<FileSubmission>[];
}

export class SubmissionStore {
  @observable state: FileSubmissionState = {
    submissions: [],
    loading: true
  };

  constructor() {
    axios
      .get('/file_submission/packages')
      .then(({ data }) => {
        this.state.submissions = data || [];
      })
      .finally(() => (this.state.loading = false));
  }

  @computed
  get all(): SubmissionPackage<FileSubmission>[] {
    return [...this.state.submissions].sort((a, b) => a.submission.order - b.submission.order);
  }

  @computed
  get isLoading(): boolean {
    return this.state.loading;
  }

  @action
  addOrUpdateSubmission(submission: SubmissionPackage<FileSubmission>) {
    const index: number = this.state.submissions.findIndex(
      s => s.submission.id === submission.submission.id
    );
    if (index === -1) {
      this.state.submissions.push(submission);
    } else {
      this.state.submissions[index] = submission;
    }
  }

  @action removeSubmission(id: string) {
    const index: number = this.state.submissions.findIndex(s => s.submission.id === id);
    if (index !== -1) this.state.submissions.splice(index, 1);
  }

  @action
  setSubmissions(submissions: SubmissionPackage<FileSubmission>[]) {
    this.state.submissions = submissions || [];
  }
}

export const submissionStore = new SubmissionStore();

socket.on('FILE SUBMISSION REMOVED', (id: string) => {
  submissionStore.removeSubmission(id);
});

socket.on('FILE SUBMISSION VERIFIED', (data: SubmissionPackage<FileSubmission>) => {
  submissionStore.addOrUpdateSubmission(data);
});

socket.on('FILE SUBMISSIONS VERIFIED', (data: SubmissionPackage<FileSubmission>[]) => {
  submissionStore.setSubmissions(data);
});
