export interface Folder {
  value?: string;
  label: string;
  children?: Folder[];
  nsfw?: boolean;
}
