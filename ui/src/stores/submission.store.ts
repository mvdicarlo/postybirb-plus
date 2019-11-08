import { observable, computed, action } from 'mobx';
import axios from '../utils/http';
import { SubmissionDTO } from '../interfaces/submission.interface';

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
    return [...this.state.submissions];
  }

  @computed
  get isLoading(): boolean {
    return this.state.loading;
  }

  @action
  addSubmission(submission: SubmissionDTO) {
    this.state.submissions.push(submission);
  }

  @action
  setSubmissions(submissions: SubmissionDTO[]) {
    this.state.submissions = submissions || [];
  }
}

export const submissionStore = new SubmissionStore();
