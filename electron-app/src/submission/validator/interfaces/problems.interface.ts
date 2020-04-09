export interface Problems {
  // accountid
  [key: string]: Problem;
}

export interface Problem {
  problems: string[];
  warnings: string[];
  website: string;
  accountId: string;
}
