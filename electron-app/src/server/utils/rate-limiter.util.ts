import { CancellationTokenDynamic } from '../submission/post/cancellation/cancellation-token-dynamic';
import { CancellationException } from '../submission/post/cancellation/cancellation.exception';

export class RateLimiterUtil {
  constructor(private readonly limitMs: number) {}

  private rateLimit = Promise.resolve<CancellationException | void>(undefined);

  trigger(cancellationToken: CancellationTokenDynamic) {
    const oldLimit = this.rateLimit;

    // Set limit for future requests
    this.rateLimit = new Promise(r => oldLimit.then(() => setTimeout(r, this.limitMs)));

    // Create new limit and hook into it to be able to cancel it
    const newLimit = new Promise((r, t) => {
      cancellationToken.cancelCallback = () => t(new CancellationException());
      oldLimit.then(r).catch(t);
    });

    return newLimit;
  }
}
