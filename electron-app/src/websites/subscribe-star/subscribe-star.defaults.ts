import {
  SubscribeStarFileOptions,
  SubscribeStarNotificationOptions,
} from './subscribe-star.interface';

export const SubscribeStarDefaultFileOptions: SubscribeStarFileOptions = {
  tier: 'free',
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

export const SubscribeStarDefaultNotificationOptions: SubscribeStarNotificationOptions = {
  tier: 'free',
  tags: {
    extendDefault: true,
    value: [],
  },
  description: {
    overwriteDefault: false,
    value: '',
  },
  rating: null,
};
