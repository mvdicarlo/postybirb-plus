export class ApiResponse<T> {
  static fromMaybeMultipleErrors<T extends { errors: unknown }>(err: unknown | unknown[]) {
    return new ApiResponse<T>({
      error: this.maybeMultipleErrorsToString(err, false),
      data: {
        errors: this.maybeMultipleErrorsToString(err, true),
      } as T,
    });
  }

  private static maybeMultipleErrorsToString(err: unknown, stacktrace = false): string {
    return Array.isArray(err)
      ? err.map(e => this.maybeErrorToString(e, stacktrace)).join('\n')
      : this.maybeErrorToString(err, stacktrace);
  }

  private static maybeErrorToString(e: unknown, stacktrace = false): string {
    return e instanceof Error ? (stacktrace ? e.stack : e.message) : String(e);
  }

  data: T;
  success: boolean;
  error: string;

  constructor(partial: Partial<ApiResponse<T>>) {
    Object.assign(this, partial);
    this.success = !partial.error;
  }
}
