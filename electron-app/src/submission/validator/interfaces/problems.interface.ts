export interface Problems extends Record<string, Problem> {}

export interface Problem {
  problems: string[];
  warnings: string[];
  website: string;
  accountId: string;
}
