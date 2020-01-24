export interface Settings {
  advertise: boolean;
  emptyQueueOnFailedPost: boolean;
  postRetries: number;
  openOnStartup: boolean;
  useHardwareAcceleration: boolean;
  maxPNGSizeCompression: number;
  maxPNGSizeCompressionWithAlpha: number;
  maxJPEGQualityCompression: number;
  maxJPEGSizeCompression: number;
}
