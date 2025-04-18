import { Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import * as request from 'request';
import Twitter, { AccessTokenResponse, TwitterOptions } from 'twitter-lite';
import {
  ContentBlurType,
  ESensitiveMediaWarnings_Utils,
} from './enums/twitter-sensitive-media-warnings.enum';
import { ImediaMetadataBody } from './interfaces/twitter-media-metadata-body.interface';
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

  private getClient(apiKeys: ApiData, token?: any, version?: string) {
    const config: TwitterOptions = {
      consumer_key: apiKeys.key,
      consumer_secret: apiKeys.secret,
      version: version || '1.1',
      extension: version === '2' ? false : true,
    };
    if (token) {
      config.access_token_key = token.oauth_token;
      config.access_token_secret = token.oauth_token_secret;
    }
    return new Twitter(config);
  }

  async startAuthorization(
    data: ApiData,
  ): Promise<ApiResponse<{ url: string; oauth_token: string }>> {
    try {
      const auth = await this.getClient(data).getRequestToken('oob');
      return new ApiResponse({
        data: {
          url: `https://api.twitter.com/oauth/authenticate?oauth_token=${
            (auth as any).oauth_token
          }`,
          oauth_token: (auth as any).oauth_token,
        },
      });
    } catch (err) {
      this.logger.error(err, err.stack, 'Twitter Auth Start Failure');
      return new ApiResponse({ error: err });
    }
  }

  async completeAuthorization(
    data: TwitterAuthorization,
  ): Promise<ApiResponse<AccessTokenResponse>> {
    try {
      const auth = await this.getClient({ key: data.key, secret: data.secret }).getAccessToken({
        oauth_token: data.oauth_token,
        oauth_verifier: data.verifier,
      });
      return new ApiResponse({ data: auth });
    } catch (err) {
      this.logger.error(err, err.stack, 'Twitter Auth Complete Failure');
      return new ApiResponse({ error: err });
    }
  }

  private getOAuth(apiKeys: ApiData, client: Twitter) {
    const tokens = client['token'];

    const oauth: TwitterOAuth = {
      consumer_key: apiKeys.key,
      consumer_secret: apiKeys.secret,
      token: tokens.key,
      token_secret: tokens.secret,
    };

    return oauth;
  }

  private async request(
    method: 'get' | 'post',
    url: string,
    purpose: string,
    oauth: TwitterOAuth,
    form?: unknown,
    formData?: unknown,
  ) {
    return await new Promise((resolve, reject) => {
      request[method](
        url,
        {
          json: true,
          form,
          formData,
          oauth,
        },
        (err, res, body) => {
          if (err) {
            this.logger.error(err, `Failed to ${purpose} (${method} ${url})`);
            return reject(new Error(`Failed to ${purpose}: ` + String(err)));
          }

          if (body && body.errors) {
            reject(body.errors);
          } else {
            resolve(body);
          }
        },
      );
    });
  }

  async post(
    apiKeys: ApiData,
    data: SubmissionPost<{ contentBlur: ContentBlurType }>,
  ): Promise<ApiResponse<{ url: string }>> {
    const client = this.getClient(apiKeys, {
      oauth_token: data.token,
      oauth_token_secret: data.secret,
    });

    const tweets: SendTweetV2Params[] = [];
    const tweet: SendTweetV2Params = {
      text: data.description || '',
      // possibly_sensitive: data.rating !== 'general',
    };

    tweet.text = tweet?.text || '';

    let mediaIds = [];
    if (data.files.length) {
      // File submissions
      try {
        mediaIds = await Promise.all(
          data.getFilesforPost().map(file => this.uploadMedia(apiKeys, client, file)),
        );

        // Get Twitter warning tag
        const twitterSMW =
          ESensitiveMediaWarnings_Utils.getSMWFromContentBlur(data?.options?.contentBlur) ??
          undefined;
        // And apply it if any
        if (twitterSMW)
          await Promise.all(
            mediaIds.map(mediaIdIter => {
              const mediaMdBody: ImediaMetadataBody = { media_id: mediaIdIter };
              mediaMdBody.sensitive_media_warning = [twitterSMW];
              return client.post('media/metadata/create', mediaMdBody);
            }),
          );
      } catch (err) {
        this.logger.error(err, err.stack, 'Failed to upload files to Twitter');
        return ApiResponse.fromMaybeMultipleErrors<{ url: string; errors: unknown }>(err);
      }

      const ids = _.chunk(mediaIds, 4);
      ids.forEach((idGroup, i) => {
        const t = { ...tweet, media: { media_ids: idGroup } };
        if (ids.length > 1) {
          if (i === 0) {
            const numberedStatus = `${i + 1}/${ids.length} ${t.text}`;
            if (numberedStatus.length <= 280) {
              t.text = numberedStatus;
            }
          }
          if (i > 0) {
            t.text = `${i + 1}/${ids.length}`;
          }
        }
        tweets.push(t);
      });
    } else {
      tweets.push(tweet);
    }

    try {
      let url: string;
      let replyId;
      for (const t of tweets) {
        if (replyId) {
          t.reply = { in_reply_to_tweet_id: replyId };
        }

        const oauth = this.getOAuth(apiKeys, client);
        const post = await this.postTweet(t, oauth);
        const me = await this.getAuthenticatedUser(oauth);
        if (!url) {
          url = `https://twitter.com/${me.data.username}/status/${post.data.id}`;
        }
        replyId = post.id_str;
      }
      return new ApiResponse({ data: { url } });
    } catch (err) {
      this.logger.error(err, '', 'Failed to post');
      return ApiResponse.fromMaybeMultipleErrors<{ url: string; errors: unknown }>(err);
    }
  }

  private getAuthenticatedUser(oauth: TwitterOAuth): Promise<any> {
    const url = 'https://api.twitter.com/2/users/me';
    return this.request('get', url, 'get authenticated user', oauth);
  }

  private postTweet(form: any, oauth: TwitterOAuth): Promise<any> {
    const url = 'https://api.twitter.com/2/tweets';
    return this.request('post', url, 'post tweet', oauth, form);
  }

  private async uploadMedia(apiKeys: ApiData, client: Twitter, file: RequestFile): Promise<string> {
    const init = {
      command: 'INIT',
      media_type: file.options.contentType,
      total_bytes: file.value.length,
      media_category: 'tweet_image',
    };

    if (file.options.contentType === 'image/gif') {
      init.media_category = 'tweet_gif';
    } else if (!file.options.contentType.includes('image')) {
      // Assume video type
      init.media_category = 'tweet_video';
    }

    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    const oauth = this.getOAuth(apiKeys, client);
    const mediaData: any = await this.request('post', url, 'upload media', oauth, init);

    if (!mediaData) throw new Error('Failed to get uploaded media ids');

    const { media_id_string } = mediaData;
    const chunks = _.chunk(file.value, this.MAX_FILE_CHUNK);
    await Promise.all(
      chunks.map((chunk, i) => this.uploadChunk(oauth, media_id_string, Buffer.from(chunk), i)),
    );

    await this.request('post', url, 'finalize media upload', oauth, {
      command: 'FINALIZE',
      media_id: media_id_string,
    });

    return media_id_string;
  }

  private uploadChunk(oauth: TwitterOAuth, id: string, chunk: Buffer, index: number): Promise<any> {
    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    return this.request('post', url, `upload chunk ${index}`, oauth, undefined, {
      command: 'APPEND',
      media_id: id,
      media_data: chunk.toString('base64'),
      segment_index: index,
    });
  }
}
