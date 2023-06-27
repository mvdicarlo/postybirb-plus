const STORE_KEY: string = 'ScrollSubmissionId';

class ScrollSubmissionStore {
  set(submissionId: string) {
    sessionStorage.setItem(STORE_KEY, submissionId);
  }

  check(submissionId: string) {
    if (sessionStorage.getItem(STORE_KEY) === submissionId) {
      sessionStorage.removeItem(STORE_KEY);
      return true;
    } else {
      return false;
    }
  }
}

export const scrollSubmissionStore = new ScrollSubmissionStore();
