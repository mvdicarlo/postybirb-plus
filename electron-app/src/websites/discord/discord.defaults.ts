import { DiscordOptions } from './discord.interface';

export const DISCORD_DEFAULT_FILE_SUBMISSION_OPTIONS: DiscordOptions = {
  spoiler: false,
  useTitle: true,
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
  autoScale: true,
};
