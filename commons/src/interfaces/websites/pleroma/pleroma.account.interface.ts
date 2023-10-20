import { OAuth } from 'megalodon'
export interface PleromaAccountData {
  tokenData: OAuth.TokenData | null;
  website: string;
  username: string;
}
