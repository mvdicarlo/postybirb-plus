import { OAuth } from 'megalodon'
export interface MissKeyAccountData {
  tokenData: OAuth.TokenData | null;
  website: string;
  username: string;
}
