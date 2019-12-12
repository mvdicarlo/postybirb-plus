import { DefaultDiscordSubmissionOptions } from './discord.interface';

export const DEFAULT_FILE_SUBMISSION_OPTIONS: DefaultDiscordSubmissionOptions = {
  embed: true,
  spoiler: false,
  tags: {
    extendDefault: true,
    value: [],
  },
  description: {
    overwriteDefault: false,
    value: '',
  },
  rating: null,
  useThumbnail: true,
};
