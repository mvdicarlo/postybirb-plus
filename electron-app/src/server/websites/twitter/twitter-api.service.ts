import { Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import * as request from 'request';
import Twitter, { AccessTokenResponse, TwitterOptions } from 'twitter-lite';
import {
  ContentBlurType,
  ESensitiveMediaWarnings_Utils,
} from './enums/twitter-sensitive-media-warnings.enum';
import { IMediaMetadataBody } from './interfaces/twitter-media-metadata-body.interface';
import { ApiResponse } from './models/api-response.model';
import { RequestFile, SubmissionPost } from './models/submission-post.model';
import { TwitterAuthorization } from './models/twitter-authorization.model';

type ApiData = {
  key: string;
  secret: string;
};

// Typings borrowed from twitter-api-v2
type TTweetReplySettingsV2 = 'mentionedUsers' | 'following' | 'everyone';
interface SendTweetV2Params {
  direct_message_deep_link?: string;
  for_super_followers_only?: 'True' | 'False';
  geo?: {
    place_id: string;
  };
  media?: {
    media_ids?: string[];
    tagged_user_ids?: string[];
  };
  poll?: {
    duration_minutes: number;
    options: string[];
  };
  quote_tweet_id?: string;
  reply?: {
    exclude_reply_user_ids?: string[];
    in_reply_to_tweet_id: string;
  };
  reply_settings?: TTweetReplySettingsV2 | string;
  text?: string;
}

interface TwitterOAuth {
  consumer_key: string;
  consumer_secret: string;
  token: string;
  token_secret: string;
}

@Injectable()
export class TwitterAPIService {
  private readonly logger = new Logger(TwitterAPIService.name);

  private readonly MAX_FILE_CHUNK: number = 5 * 1024 * 1024;
  private readonly MAX_TWEET_LENGTH: number = 280;
  private readonly MAX_MEDIA_PER_TWEET: number = 4;
  private readonly API_BASE_URL = 'https://api.twitter.com';
  private readonly UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json';

  /**
   * Create a Twitter API client
   */
  private getClient(apiKeys: ApiData, token?: any, version?: string): Twitter {
    this.logger.debug('Creating Twitter client');

    const config: TwitterOptions = {
      consumer_key: apiKeys.key,
      consumer_secret: apiKeys.secret,
      version: version || '1.1',
      extension: version === '2' ? false : true,
    };

    if (token) {
      config.access_token_key = token.oauth_token;
      config.access_token_secret = token.oauth_token_secret;
      this.logger.debug('Twitter client created with user authentication');
    } else {
      this.logger.debug('Twitter client created for app-only authentication');
    }

    return new Twitter(config);
  }

  /**
   * Create OAuth credentials object from API keys and client token
   */
  private getOAuth(apiKeys: ApiData, client: Twitter): TwitterOAuth {
    const tokens = client['token'];

    const oauth: TwitterOAuth = {
      consumer_key: apiKeys.key,
      consumer_secret: apiKeys.secret,
      token: tokens.key,
      token_secret: tokens.secret,
    };

    // Log partial tokens for debugging (hiding most characters for security)
    this.logger.debug(
      `OAuth credentials created: consumer_key=${this.maskString(
        apiKeys.key,
      )}, token=${this.maskString(tokens.key)}`,
    );

    return oauth;
  }

  /**
   * Helper to mask string for secure logging
   */
  private maskString(str: string): string {
    if (!str) return 'undefined';
    if (str.length <= 8) return '****';
    return `${str.substring(0, 3)}...${str.substring(str.length - 3)}`;
  }

  /**
   * Start Twitter authorization process - get request token
   */
  async startAuthorization(
    data: ApiData,
  ): Promise<ApiResponse<{ url: string; oauth_token: string }>> {
    this.logger.log('Starting Twitter authorization process');

    try {
      if (!data.key || !data.secret) {
        this.logger.error('Missing Twitter API keys');
        return new ApiResponse({ error: 'Twitter API key and secret are required' });
      }

      this.logger.debug('Requesting OAuth token from Twitter');
      const auth = await this.getClient(data).getRequestToken('oob');

      const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${
        (auth as any).oauth_token
      }`;
      this.logger.log(
        `Twitter OAuth request token obtained: ${this.maskString((auth as any).oauth_token)}`,
      );

      return new ApiResponse({
        data: {
          url: authUrl,
          oauth_token: (auth as any).oauth_token,
        },
      });
    } catch (err) {
      this.logger.error(`Twitter Auth Start Failure: ${err.message}`, err.stack);
      return new ApiResponse({
        error: `Failed to start Twitter authorization: ${err.message}`,
      });
    }
  }

  /**
   * Complete Twitter authorization process - exchange verifier for access token
   */
  async completeAuthorization(
    data: TwitterAuthorization,
  ): Promise<ApiResponse<AccessTokenResponse>> {
    this.logger.log('Completing Twitter authorization');

    try {
      if (!data.key || !data.secret || !data.oauth_token || !data.verifier) {
        const missing = [];
        if (!data.key) missing.push('API key');
        if (!data.secret) missing.push('API secret');
        if (!data.oauth_token) missing.push('OAuth token');
        if (!data.verifier) missing.push('verifier');

        this.logger.error(`Missing required authorization data: ${missing.join(', ')}`);
        return new ApiResponse({
          error: `Missing required authorization data: ${missing.join(', ')}`,
        });
      }

      this.logger.debug('Exchanging verifier for access token');
      const auth = await this.getClient({ key: data.key, secret: data.secret }).getAccessToken({
        oauth_token: data.oauth_token,
        oauth_verifier: data.verifier,
      });

      this.logger.log('Twitter access token obtained successfully');
      return new ApiResponse({ data: auth });
    } catch (err) {
      this.logger.error(`Twitter Auth Completion Failure: ${err.message}`, err.stack);
      return new ApiResponse({
        error: `Failed to complete Twitter authorization: ${err.message}`,
      });
    }
  }

  /**
   * Make HTTP request to Twitter API with proper OAuth
   */
  private async request(
    method: 'get' | 'post',
    url: string,
    purpose: string,
    oauth: TwitterOAuth,
    form?: any,
    formData?: any,
    body?: any,
  ): Promise<any> {
    this.logger.debug(`Twitter API Request: ${method.toUpperCase()} ${url} - ${purpose}`);

    return new Promise((resolve, reject) => {
      const options: request.CoreOptions = {
        json: true,
        oauth,
      };

      if (form) options.form = form;
      if (formData) options.formData = formData;
      if (body) options.body = body;

      request[method](url, options, (err, res, responseBody) => {
        if (err) {
          this.logger.error(`Network error in ${purpose}: ${err.message}`);
          return reject(new Error(`Network error: ${err.message}`));
        }

        // Check for HTTP errors
        if (res.statusCode >= 400) {
          const statusMessage = `HTTP ${res.statusCode}: ${res.statusMessage || 'Unknown Error'}`;
          this.logger.error(`Twitter API HTTP error (${purpose}): ${statusMessage}`);

          let errorDetail = '';
          if (responseBody) {
            if (responseBody.errors) {
              const errors = Array.isArray(responseBody.errors)
                ? responseBody.errors
                : [responseBody.errors];

              errors.forEach((e: any) => {
                this.logger.error(`Twitter API error: ${JSON.stringify(e)}`);
                if (e.code) {
                  this.logTwitterErrorCode(e.code, e.message);
                }
              });

              errorDetail = Array.isArray(responseBody.errors)
                ? responseBody.errors.map((e: any) => e.message || JSON.stringify(e)).join('; ')
                : JSON.stringify(responseBody.errors);
            } else if (responseBody.error) {
              errorDetail = responseBody.error;
            } else if (typeof responseBody === 'string') {
              errorDetail = responseBody;
            } else if (responseBody.detail) {
              errorDetail = responseBody.detail;
            } else {
              errorDetail = JSON.stringify(responseBody);
            }
          }

          // Handle specific status codes
          if (res.statusCode === 401) {
            return reject(
              new Error(
                `Authentication failed: ${errorDetail || 'Invalid or expired credentials'}`,
              ),
            );
          } else if (res.statusCode === 429) {
            return reject(new Error(`Rate limit exceeded: ${errorDetail || 'Too many requests'}`));
          }

          return reject(new Error(`${statusMessage}: ${errorDetail}`));
        }

        // Check for Twitter error responses that might come with 200 status
        if (responseBody && responseBody.errors) {
          const errors = Array.isArray(responseBody.errors)
            ? responseBody.errors
            : [responseBody.errors];
          const errorMessages = errors.map((e: any) => e.message || JSON.stringify(e)).join('; ');

          this.logger.error(`Twitter API errors in ${purpose}: ${errorMessages}`);
          return reject(new Error(errorMessages));
        }

        this.logger.debug(`Twitter API success (${purpose}): HTTP ${res.statusCode}`);
        resolve(responseBody);
      });
    });
  }

  /**
   * Log common Twitter error codes with helpful explanations
   */
  private logTwitterErrorCode(code: number, message: string): void {
    switch (code) {
      case 32:
        this.logger.error(`Twitter Error Code 32: Could not authenticate you. Check API keys.`);
        break;
      case 88:
        this.logger.error(`Twitter Error Code 88: Rate limit exceeded. Wait before retrying.`);
        break;
      case 89:
        this.logger.error(
          `Twitter Error Code 89: Invalid or expired token. User needs to re-authenticate.`,
        );
        break;
      case 99:
        this.logger.error(
          `Twitter Error Code 99: Unable to verify your credentials. The app may be suspended.`,
        );
        break;
      case 187:
        this.logger.error(
          `Twitter Error Code 187: Status is a duplicate. Cannot post the same tweet twice.`,
        );
        break;
      case 186:
        this.logger.error(`Twitter Error Code 186: Tweet exceeds maximum allowed length.`);
        break;
      case 354:
        this.logger.error(
          `Twitter Error Code 354: The text of your tweet might contain inappropriate content.`,
        );
        break;
      default:
        this.logger.error(`Twitter Error Code ${code}: ${message}`);
    }
  }

  /**
   * Post content to Twitter
   */
  async post(
    apiKeys: ApiData,
    data: SubmissionPost<{ contentBlur: ContentBlurType }>,
  ): Promise<ApiResponse<{ url: string }>> {
    this.logger.log('Starting Twitter post submission');

    try {
      // Validate inputs
      if (!apiKeys?.key || !apiKeys?.secret) {
        this.logger.error('Missing Twitter API keys');
        return new ApiResponse({ error: 'Twitter API keys are required' });
      }

      if (!data?.token || !data?.secret) {
        this.logger.error('Missing Twitter user tokens');
        return new ApiResponse({ error: 'Twitter user tokens are required' });
      }

      // Initialize client and OAuth once
      const client = this.getClient(apiKeys, {
        oauth_token: data.token,
        oauth_token_secret: data.secret,
      });
      this.logger.debug('Twitter client initialized');

      const oauth = this.getOAuth(apiKeys, client);
      this.logger.debug('OAuth credentials created');

      // Verify credentials before proceeding
      try {
        const me = await this.getAuthenticatedUser(oauth);
        this.logger.debug(`Authenticated as user: ${me.data.username}`);
      } catch (error) {
        this.logger.error(`Authentication failed: ${error.message}`, error.stack);
        return new ApiResponse({
          error: `Twitter authentication failed. Please re-authenticate: ${error.message}`,
        });
      }

      // Prepare tweets data
      const tweets: SendTweetV2Params[] = [];
      const tweet: SendTweetV2Params = {
        text: data.description || '',
      };

      tweet.text = tweet?.text || '';
      this.logger.debug(`Tweet text prepared (${tweet.text.length} characters)`);

      // Process media files if any
      let mediaIds: string[] = [];
      if (data.files && data.files.length > 0) {
        this.logger.log(`Processing ${data.files.length} files for upload`);

        try {
          // Upload each file
          mediaIds = await Promise.all(
            data.getFilesforPost().map((file, index) => {
              this.logger.debug(
                `Uploading file ${index + 1}/${data.files.length}: ${file.options.filename}`,
              );
              return this.uploadMedia(oauth, file);
            }),
          );

          this.logger.log(`Successfully uploaded ${mediaIds.length} files to Twitter`);

          // Apply content warnings if needed
          const twitterSMW = ESensitiveMediaWarnings_Utils.getSMWFromContentBlur(
            data?.options?.contentBlur,
          );

          if (twitterSMW) {
            this.logger.debug(`Applying ${twitterSMW} content warning to media`);
            await Promise.all(
              mediaIds.map(async mediaId => {
                try {
                  const mediaMdBody: IMediaMetadataBody = {
                    media_id: mediaId,
                    sensitive_media_warning: [twitterSMW],
                  };

                  await this.request(
                    'post',
                    `${this.API_BASE_URL}/1.1/media/metadata/create.json`,
                    `apply content warning to media ${mediaId}`,
                    oauth,
                    mediaMdBody,
                  );

                  this.logger.debug(`Content warning applied to media ID: ${mediaId}`);
                } catch (err) {
                  // Non-fatal: continue even if metadata application fails
                  this.logger.warn(
                    `Failed to apply content warning to media ${mediaId}: ${err.message}`,
                  );
                }
              }),
            );
          }
        } catch (err) {
          this.logger.error(`Failed to upload files to Twitter: ${err.message}`, err.stack);
          return new ApiResponse({
            error: Array.isArray(err)
              ? err.map(e => e.message).join('\n')
              : err.message || String(err),
          });
        }

        // Split media into chunks of MAX_MEDIA_PER_TWEET (Twitter's limit)
        const mediaChunks = _.chunk(mediaIds, this.MAX_MEDIA_PER_TWEET);
        this.logger.log(
          `Media split into ${mediaChunks.length} tweet${mediaChunks.length > 1 ? 's' : ''}`,
        );

        mediaChunks.forEach((idGroup, i) => {
          const t = { ...tweet, media: { media_ids: idGroup } };

          // For multiple tweets, add numbering
          if (mediaChunks.length > 1) {
            if (i === 0) {
              const numberedStatus = `${i + 1}/${mediaChunks.length} ${t.text}`;
              if (numberedStatus.length <= this.MAX_TWEET_LENGTH) {
                t.text = numberedStatus;
              }
            } else {
              t.text = `${i + 1}/${mediaChunks.length}`;
            }
          }

          tweets.push(t);
        });
      } else {
        this.logger.debug('No files to upload, preparing text-only tweet');
        tweets.push(tweet);
      }

      // Post the tweets
      try {
        this.logger.log(`Posting ${tweets.length} tweet${tweets.length > 1 ? 's' : ''}`);
        let url: string;
        let replyId: string;

        // Get user info
        const me = await this.getAuthenticatedUser(oauth);
        const username = me.data.username;
        this.logger.debug(`Will post as user: ${username}`);

        // Post each tweet in sequence
        for (let i = 0; i < tweets.length; i++) {
          const t = tweets[i];

          // Make this a reply if we have a previous tweet
          if (replyId) {
            t.reply = { in_reply_to_tweet_id: replyId };
            this.logger.debug(`Tweet ${i + 1} will be a reply to tweet ID: ${replyId}`);
          }

          this.logger.debug(`Posting tweet ${i + 1}/${tweets.length}: ${this.logTweetSummary(t)}`);
          const post = await this.postTweet(t, oauth);

          // Save the ID for making the next tweet a reply
          replyId = post.data.id;
          this.logger.debug(`Tweet ${i + 1} posted with ID: ${replyId}`);

          // Save the URL of the first tweet
          if (!url) {
            url = `https://twitter.com/${username}/status/${replyId}`;
            this.logger.log(`First tweet posted: ${url}`);
          }
        }

        this.logger.log('Twitter submission completed successfully');
        return new ApiResponse({ data: { url } });
      } catch (err) {
        this.logger.error(`Failed to post tweets: ${err.message}`, err.stack);
        return new ApiResponse({
          error: Array.isArray(err)
            ? err.map(e => e.message).join('\n')
            : err.message || String(err),
        });
      }
    } catch (err) {
      this.logger.error(`Unexpected error during Twitter submission: ${err.message}`, err.stack);
      return new ApiResponse({
        error: `Unexpected error: ${err.message}`,
      });
    }
  }

  /**
   * Format tweet data for logging without sensitive info
   */
  private logTweetSummary(tweet: SendTweetV2Params): string {
    const parts = [];

    if (tweet.text) {
      parts.push(
        `text: "${tweet.text.length > 30 ? tweet.text.substring(0, 27) + '...' : tweet.text}" (${
          tweet.text.length
        } chars)`,
      );
    }

    if (tweet.media?.media_ids?.length) {
      parts.push(`media: ${tweet.media.media_ids.length} items`);
    }

    if (tweet.reply?.in_reply_to_tweet_id) {
      parts.push(`reply to: ${tweet.reply.in_reply_to_tweet_id}`);
    }

    return parts.join(', ');
  }

  /**
   * Get information about the authenticated user
   */
  private getAuthenticatedUser(oauth: TwitterOAuth): Promise<any> {
    this.logger.debug('Getting authenticated user information');
    return this.request('get', `${this.API_BASE_URL}/2/users/me`, 'get authenticated user', oauth);
  }

  /**
   * Post a tweet
   */
  private postTweet(tweet: SendTweetV2Params, oauth: TwitterOAuth): Promise<any> {
    return this.request(
      'post',
      `${this.API_BASE_URL}/2/tweets`,
      'post tweet',
      oauth,
      null,
      null,
      tweet,
    );
  }

  /**
   * Upload media to Twitter
   */
  private async uploadMedia(oauth: TwitterOAuth, file: RequestFile): Promise<string> {
    try {
      this.logger.debug(
        `Initializing upload for file: ${file.options.filename} (${file.options.contentType}, ${file.value.length} bytes)`,
      );

      // Determine media category based on file type
      let mediaCategory = 'tweet_image';
      if (file.options.contentType === 'image/gif') {
        mediaCategory = 'tweet_gif';
      } else if (!file.options.contentType.includes('image')) {
        // Assume video type
        mediaCategory = 'tweet_video';
      }

      this.logger.debug(`Media category for upload: ${mediaCategory}`);

      // INIT phase - initialize the media upload
      const init = {
        command: 'INIT',
        media_type: file.options.contentType,
        total_bytes: file.value.length,
        media_category: mediaCategory,
      };

      const mediaData = await this.request(
        'post',
        this.UPLOAD_URL,
        'initialize media upload',
        oauth,
        init,
      );

      if (!mediaData?.media_id_string) {
        throw new Error('Failed to initialize media upload: No media ID returned from Twitter');
      }

      const mediaId = mediaData.media_id_string;
      this.logger.debug(`Media upload initialized with ID: ${mediaId}`);

      // APPEND phase - upload the file in chunks
      const chunks = _.chunk(file.value, this.MAX_FILE_CHUNK);
      this.logger.debug(`Uploading file in ${chunks.length} chunks`);

      // Upload each chunk sequentially to avoid rate limits
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        this.logger.debug(`Uploading chunk ${i + 1}/${chunks.length} for media ID: ${mediaId}`);

        await this.uploadChunk(oauth, mediaId, Buffer.from(chunk), i);
      }

      // FINALIZE phase - tell Twitter we're done uploading
      this.logger.debug(`Finalizing media upload for ID: ${mediaId}`);
      await this.request('post', this.UPLOAD_URL, 'finalize media upload', oauth, {
        command: 'FINALIZE',
        media_id: mediaId,
      });

      // For videos and GIFs, we need to wait for processing to complete
      if (mediaCategory === 'tweet_video' || mediaCategory === 'tweet_gif') {
        await this.waitForMediaProcessing(oauth, mediaId);
      }

      this.logger.debug(`Media upload completed for ID: ${mediaId}`);
      return mediaId;
    } catch (error) {
      this.logger.error(
        `Media upload failed for ${file.options.filename}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  }

  /**
   * Upload a single chunk of media data
   */
  private async uploadChunk(
    oauth: TwitterOAuth,
    mediaId: string,
    chunk: Buffer,
    index: number,
  ): Promise<void> {
    try {
      await this.request('post', this.UPLOAD_URL, `upload chunk ${index}`, oauth, undefined, {
        command: 'APPEND',
        media_id: mediaId,
        media_data: chunk.toString('base64'),
        segment_index: index,
      });

      this.logger.debug(`Chunk ${index} uploaded successfully for media ID: ${mediaId}`);
    } catch (error) {
      this.logger.error(
        `Failed to upload chunk ${index} for media ID ${mediaId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Wait for media processing to complete (for videos and GIFs)
   */
  private async waitForMediaProcessing(oauth: TwitterOAuth, mediaId: string): Promise<void> {
    this.logger.debug(`Checking processing status for media ID: ${mediaId}`);

    let processing = true;
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite loops

    while (processing && attempts < maxAttempts) {
      attempts++;

      try {
        const statusResponse = await this.request(
          'post',
          this.UPLOAD_URL,
          `check media processing status (attempt ${attempts})`,
          oauth,
          {
            command: 'STATUS',
            media_id: mediaId,
          },
        );

        const processingInfo = statusResponse.processing_info;

        if (!processingInfo) {
          // No processing info means it's ready
          this.logger.debug(`Media ${mediaId} is ready (no processing required)`);
          processing = false;
        } else if (processingInfo.state === 'succeeded') {
          this.logger.debug(`Media ${mediaId} processing completed successfully`);
          processing = false;
        } else if (processingInfo.state === 'failed') {
          const errorMessage = processingInfo.error?.message || 'Unknown processing error';
          this.logger.error(`Media ${mediaId} processing failed: ${errorMessage}`);
          throw new Error(`Media processing failed: ${errorMessage}`);
        } else {
          // Still processing, wait and try again
          const waitTime = processingInfo.check_after_secs * 1000 || 5000;
          this.logger.debug(
            `Media ${mediaId} still processing (state: ${processingInfo.state}), waiting ${
              waitTime / 1000
            }s before checking again`,
          );
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } catch (error) {
        this.logger.error(`Error checking media processing status: ${error.message}`);
        throw error;
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error(`Media processing timed out after ${maxAttempts} attempts`);
    }
  }
}
