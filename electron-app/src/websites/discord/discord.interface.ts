import { DefaultOptions } from '../../submission/interfaces/submission-part.interface';

export interface DefaultDiscordSubmissionOptions extends DefaultOptions {
  embed: boolean;
  spoiler: boolean;
}
