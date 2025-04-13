import { CancellationToken } from './cancellation-token';

// The only difference between them is that dynamic allows writing to the cancellation callback
export class CancellationTokenDynamic extends CancellationToken {
  constructor(public cancelCallback?: VoidFunction) {
    super(cancelCallback);
  }
}
