import { CancellationTokenDynamic } from '../submission/post/cancellation/cancellation-token-dynamic';
import { CancellationException } from '../submission/post/cancellation/cancellation.exception';
import { RateLimiterUtil } from './rate-limiter.util';

describe('RateLimitUtil', () => {
  it('should enforce the rate limit', async () => {
    const limitMs = 10;
    const rateLimiter = new RateLimiterUtil(limitMs);

    const startTime = Date.now();
    await rateLimiter.trigger(new CancellationTokenDynamic());
    const endTime1 = Date.now();
    expect(endTime1 - startTime).toBeLessThanOrEqual(limitMs);

    await rateLimiter.trigger(new CancellationTokenDynamic());
    const endTime2 = Date.now();
    expect(endTime2 - endTime1).toBeGreaterThanOrEqual(limitMs);
  });

  it('should handle concurrent calls correctly', async () => {
    const limitMs = 10;
    const rateLimiter = new RateLimiterUtil(limitMs);

    const startTime = Date.now();
    const promises = [];
    for (let i = 0; i <= 3; i++) {
      promises.push(rateLimiter.trigger(new CancellationTokenDynamic()));
    }
    await Promise.all(promises);
    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThanOrEqual(3 * limitMs);
  });

  it('should not delay the first call', async () => {
    const limitMs = 10;
    const rateLimiter = new RateLimiterUtil(limitMs);

    const startTime = Date.now();
    await rateLimiter.trigger(new CancellationTokenDynamic());
    const endTime = Date.now();

    // The first call should not be significantly delayed.
    expect(endTime - startTime).toBeLessThan(5);
  });

  it('should allow calls after the timeout', async () => {
    const limitMs = 10;
    const rateLimiter = new RateLimiterUtil(limitMs);

    await rateLimiter.trigger(new CancellationTokenDynamic());
    await new Promise(r => setTimeout(r, limitMs * 2)); // Wait longer than the limit

    const startTime = Date.now();
    await rateLimiter.trigger(new CancellationTokenDynamic());
    const endTime = Date.now();

    // After waiting, the next call should not be delayed much
    expect(endTime - startTime).toBeLessThan(5);
  });

  it('should handle cancel', async () => {
    const token = new CancellationTokenDynamic();
    const limitMs = 1000;
    const rateLimiter = new RateLimiterUtil(limitMs);

    const startTime = Date.now();
    await rateLimiter.trigger(token);
    const endTime1 = Date.now();
    expect(endTime1 - startTime).toBeLessThanOrEqual(limitMs);

    setTimeout(() => token.cancel(), 100);

    // For some unknown reason jest wasn't happy with async functions in expect().toThrow()
    // so i had to write it like this
    try {
      const a = await rateLimiter.trigger(token);
      throw new Error('RateLimit cancellation did not throw! ' + a);
    } catch (e) {
      if (!(e instanceof CancellationException)) throw e;
    }

    const endTime2 = Date.now();
    expect(endTime2 - endTime1).toBeLessThanOrEqual(510);
  });
});
