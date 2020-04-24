export class CancellationException extends Error {
  constructor() {
    super('Cancelled');
  }
}
