export class ApiResponse<T> {
  data: T;
  success: boolean;
  error: string;

  constructor(partial: Partial<ApiResponse<T>>) {
    Object.assign(this, partial);
    this.success = !partial.error;
  }
}
