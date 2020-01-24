export interface Settings {
  advertise: boolean;
  emptyQueueOnFailedPost: boolean;
  postRetries: number;
  openOnStartup: boolean;
  useHardwareAcceleration: boolean;
  maxPNGSizeComression: number;
  maxPNGSizeCompressionWithAlpha: number;
  maxJPEGQualityCompression: number;
  maxJPEGSizeCompression: number;
}
