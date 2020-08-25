export default class WaitUtil {
  static wait(ms: number): Promise<void> {
    if (ms <= 0) {
      throw new Error('Wait ms must be > 0');
    }
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}
