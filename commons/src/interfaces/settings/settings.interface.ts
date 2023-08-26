// Cannot use an empty string value here-- the data handling code does not like it.
type TagSearchProviders = 'none' | 'artconomy' | 'e621'

export interface Settings {
  advertise: boolean;
  emptyQueueOnFailedPost: boolean;
  postRetries: number;
  openOnLogin: boolean;
  openWindowOnStartup: boolean;
  useHardwareAcceleration: boolean;
  maxPNGSizeCompression: number;
  maxPNGSizeCompressionWithAlpha: number;
  maxJPEGQualityCompression: number;
  maxJPEGSizeCompression: number;
  silentNotification: boolean;
  defaultTagSearchProvider: TagSearchProviders;
  proxy: string;
}
