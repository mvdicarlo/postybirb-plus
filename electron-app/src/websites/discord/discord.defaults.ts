import { DefaultDiscordOptions } from './discord.interface';

export const DISCORD_DEFAULT_FILE_SUBMISSION_OPTIONS: DefaultDiscordOptions = {
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
