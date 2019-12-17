import socket from '../utils/websocket';
import { SubmissionPackage } from '../../../electron-app/src/submission/interfaces/submission-package.interface';
import { observable, computed, action } from 'mobx';
import { SubmissionEvent } from '../shared/enums/submission.events.enum';
import { Submission } from '../../../electron-app/src/submission/interfaces/submission.interface';
import SubmissionService from '../services/submission.service';
import { SubmissionType } from '../shared/enums/submission-type.enum';

export interface SubmissionState {
  loading: boolean;
  submissions: SubmissionPackage<Submission>[];
}

export class SubmissionStore {
  @observable state: SubmissionState = {
    submissions: [],
    loading: true
  };

  constructor() {
    SubmissionService.getSubmissions(true)
      .then(({ data }) => {
        this.state.submissions = data || [];
      })
      .finally(() => (this.state.loading = false));
  }

  @computed
  get all(): SubmissionPackage<Submission>[] {
    return [...this.state.submissions].sort((a, b) => a.submission.created - b.submission.created);
  }

  @computed
  get fileSubmissions(): SubmissionPackage<Submission>[] {
    return [...this.state.submissions]
      .filter(s => s.submission.type === SubmissionType.FILE)
      .sort((a, b) => a.submission.created - b.submission.created);
  }

  @computed
  get notificationSubmissions(): SubmissionPackage<Submission>[] {
    return [...this.state.submissions]
      .filter(s => s.submission.type === SubmissionType.NOTIFICATION)
      .sort((a, b) => a.submission.created - b.submission.created);
  }

  @computed
  get isLoading(): boolean {
    return this.state.loading;
  }

  @action
  addOrUpdateSubmissions(submissions: Array<SubmissionPackage<Submission>>) {
    submissions.forEach(submission => {
      const index: number = this.state.submissions.findIndex(
        s => s.submission.id === submission.submission.id
      );
      if (index === -1) {
        this.state.submissions.push(submission);
      } else {
        this.state.submissions[index] = submission;
      }
    });
  }

  @action removeSubmission(id: string) {
    const index: number = this.state.submissions.findIndex(s => s.submission.id === id);
    if (index !== -1) this.state.submissions.splice(index, 1);
  }

  @action
  setSubmissions(submissions: SubmissionPackage<Submission>[]) {
    this.state.submissions = submissions || [];
  }
}

export const submissionStore = new SubmissionStore();

socket.on(SubmissionEvent.REMOVED, (id: string) => {
  submissionStore.removeSubmission(id);
});

socket.on(SubmissionEvent.UPDATED, (data: Array<SubmissionPackage<Submission>>) => {
  submissionStore.addOrUpdateSubmissions(data);
});

socket.on(SubmissionEvent.CREATED, (data: SubmissionPackage<Submission>) => {
  submissionStore.addOrUpdateSubmissions([data]);
});
