export interface Problems {
  // accountid
  [key: string]: {
    problems: string[];
    website: string;
    accountId: string;
  };
}
