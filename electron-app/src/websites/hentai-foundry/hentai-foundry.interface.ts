import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface HentaiFoundryFileOptions extends DefaultFileOptions {
  scraps: boolean;
  disableComments: boolean;
  category: string;
  nudityRating: string;
  violenceRating: string;
  profanityRating: string;
  racismRating: string;
  sexRating: string;
  spoilersRating: string;
  yaoi: boolean;
  yuri: boolean;
  teen: boolean;
  guro: boolean;
  furry: boolean;
  beast: boolean;
  male: boolean;
  female: boolean;
  futa: boolean;
  other: boolean;
  scat: boolean;
  incest: boolean;
  rape: boolean;
  media: string;
  timeTaken?: string;
  license: string;
  reference?: string;
}
