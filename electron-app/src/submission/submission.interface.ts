export interface Submission {
  id: string;
  title: string;
  fileLocations: {
    originalPath: string;
    submission: string;
    thumbnail: string;
    customThumbnail?: string;
  };
  order: number;
  created: number;
}
