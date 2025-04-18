export class CancellationToken {
  private cancelState: boolean = false;

  constructor(protected readonly cancelCallback?: () => void) {}

  public cancel() {
    if (!this.cancelState) {
      this.cancelState = true;
      if (this.cancelCallback) {
        this.cancelCallback();
      }
    }
  }

  public isCancelled(): boolean {
    return this.cancelState;
  }
}
