import { DiscordOptions } from './discord.interface';

export const DiscordDefaultFileOptions: DiscordOptions = {
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
