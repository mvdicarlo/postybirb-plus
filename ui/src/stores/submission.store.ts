import socket from '../utils/websocket';
import * as _ from 'lodash';
import { SubmissionPackage } from '../../../electron-app/src/submission/interfaces/submission-package.interface';
import { observable, computed, action } from 'mobx';
import { SubmissionEvent } from '../shared/enums/submission.events.enum';
import { Submission } from '../../../electron-app/src/submission/interfaces/submission.interface';
import SubmissionService from '../services/submission.service';
import { SubmissionType } from '../shared/enums/submission-type.enum';
import SubmissionUtil from '../utils/submission.util';
import { FileSubmission } from '../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import RemoteService from '../services/remote.service';

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
    const isRemote = RemoteService.isRemote();
    return [...this.state.submissions]
      .sort((a, b) => a.submission.order - b.submission.order)
      .map(rec => {
        if (!isRemote) return rec;

        const submission = rec.submission as FileSubmission;
        if (submission.primary) {
          const copy = _.cloneDeep(rec);
          const copySubmission = copy.submission as FileSubmission;
          const files = _.compact([
            copySubmission.primary,
            copySubmission.thumbnail,
            ...(copySubmission.additional || [])
          ]);
          files.forEach(f => {
            f.location = RemoteService.getFileUrl(f.location);
            f.preview = RemoteService.getFileUrl(f.preview);
          });
          return copy;
        }
        return rec;
      });
  }

  @computed
  get fileSubmissions(): SubmissionPackage<Submission>[] {
    return this.all.filter(s => s.submission.type === SubmissionType.FILE);
  }

  @computed
  get notificationSubmissions(): SubmissionPackage<Submission>[] {
    return this.all.filter(s => s.submission.type === SubmissionType.NOTIFICATION);
  }

  @computed
  get isLoading(): boolean {
    return this.state.loading;
  }

  @action
  addOrUpdateSubmissions(submissions: Array<SubmissionPackage<Submission>>) {
    submissions.forEach(submission => {
      const index: number = this.state.submissions.findIndex(
        s => s.submission._id === submission.submission._id
      );
      if (index === -1) {
        this.state.submissions.push(submission);
      } else {
        this.state.submissions[index] = submission;
      }
    });
  }

  @action removeSubmission(id: string) {
    const index: number = this.state.submissions.findIndex(s => s.submission._id === id);
    if (index !== -1) this.state.submissions.splice(index, 1);
  }

  @action
  setSubmissions(submissions: SubmissionPackage<Submission>[]) {
    this.state.submissions = submissions || [];
  }

  @action
  updateOrder(orderRecords: Record<string, number>) {
    this.state.submissions.forEach(record => {
      if (orderRecords[record.submission._id] !== undefined) {
        record.submission.order = orderRecords[record.submission._id];
      }
    });
  }

  getSubmissionTitle(id: string): string {
    const found = this.state.submissions.find(s => s.submission._id === id);
    if (found) {
      return SubmissionUtil.getSubmissionTitle(found);
    }
    return 'Unknown';
  }

  getSubmission(id: string): SubmissionPackage<Submission> | undefined {
    return this.state.submissions.find(s => s.submission._id === id);
  }

  @action
  changeOrder(id: string, from: number, to: number) {
    const fromSubmission = this.state.submissions.find(s => s.submission._id === id)!;
    const submissions: any[] = this.all.filter(
      s => s.submission.type === fromSubmission.submission.type
    );
    while (from < 0) {
      from += submissions.length;
    }
    while (to < 0) {
      to += submissions.length;
    }
    if (to >= submissions.length) {
      let k = to - submissions.length + 1;
      while (k--) {
        submissions.push(undefined);
      }
    }
    submissions.splice(to, 0, submissions.splice(from, 1)[0]);
    submissions.forEach((record, index) => {
      record.submission.order = index;
    });
    SubmissionService.changeOrder(id, to, from);
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

socket.on(SubmissionEvent.REORDER, (orderRecords: Record<string, number>) => {
  submissionStore.updateOrder(orderRecords);
});
