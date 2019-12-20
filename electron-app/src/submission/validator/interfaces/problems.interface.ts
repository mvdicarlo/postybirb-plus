export interface Problems {
  // accountid
  [key: string]: {
    problems: string[];
    warnings: string[];
    website: string;
    accountId: string;
  };
}
