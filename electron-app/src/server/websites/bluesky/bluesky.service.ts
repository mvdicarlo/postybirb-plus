import { ReplyRef } from '@atproto/api/dist/client/types/app/bsky/feed/post';
import { JobStatus } from '@atproto/api/dist/client/types/app/bsky/video/defs';
import { Injectable } from '@nestjs/common';
import FormData from 'form-data';
import fetch from 'node-fetch';
import {
  BlueskyAccountData,
  BlueskyFileOptions,
  BlueskyNotificationOptions,
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import {
  FilePostData,
  PostFile,
  PostFileRecord,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WaitUtil from 'src/server/utils/wait.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
// HACK: The atproto library contains some kind of invalid typescript
// declaration in @atproto/api, so we can't include directly from it. Rummaging
// around in the dist files directly works though.
import { BskyAgent } from '@atproto/api/dist/bsky-agent';
import {
  AppBskyEmbedImages,
  AppBskyEmbedVideo,
  AppBskyFeedThreadgate,
  AppBskyVideoGetJobStatus,
  AppBskyVideoGetUploadLimits,
  ComAtprotoLabelDefs,
} from '@atproto/api/dist/client';
import { RichText } from '@atproto/api/dist/rich-text/rich-text';
import { BlobRef } from '@atproto/lexicon';
import { AtUri } from '@atproto/syntax';
import { UsernameParser } from 'src/server/description-parsing/miscellaneous/username.parser';

function getRichTextLength(text: string): number {
  return new RichText({ text }).graphemeLength;
}

@Injectable()
export class Bluesky extends Website {
  readonly BASE_URL = '';
  readonly acceptsFiles = ['png', 'jpeg', 'jpg', 'gif', 'mp4', 'mov', 'webm'];
  readonly acceptsAdditionalFiles = true;
  readonly refreshInterval = 45 * 60000;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly MAX_CHARS = 300;
  readonly MAX_MEDIA = 4;
  readonly enableAdvertisement = false;
  readonly usernameShortcuts = [
    {
      key: 'bsky',
      url: 'https://bsky.app/profile/$1',
    },
  ];

  private makeAgent(): BskyAgent {
    // HACK: The atproto library makes a half-hearted attempt at supporting Node
    // by letting you specify a fetch handler, but then uses Headers and
    // FormData unconditionally anyway, with no way to change that behavior.
    // Patching them into the global namespace is ugly, but it works.
    globalThis.FormData = FormData as any;
    globalThis.Headers = fetch.Headers;
    globalThis.Request = fetch.Request;
    globalThis.Response = fetch.Response;
    return new BskyAgent({ service: 'https://bsky.social', fetch });
  }

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const username = data?.data?.username;
    const password = data?.data?.password;
    if (!username || !password) {
      return { loggedIn: false, username };
    }

    const status: LoginResponse = { loggedIn: false, username };
    const agent = this.makeAgent();
    await agent
      .login({
        identifier: username,
        password,
      })
      .then(res => {
        if (res.success) {
          status.loggedIn = true;
        } else {
          status.loggedIn = false;
        }
      })
      .catch(error => {
        status.loggedIn = false;
        this.logger.error(error);
      });

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return {
      // Yes they are this lame: https://github.com/bluesky-social/social-app/blob/main/src/lib/constants.ts
      maxHeight: 2000,
      maxWidth: 2000,
      maxSize: 1000000,
      noTransparency: true, // Bsky doesn't support alpha transparency.
    };
  }

  preparseDescription(text: string) {
    return UsernameParser.replaceText(text, 'bsky', '@$1');
  }

  formatTags(tags: string[]) {
    return this.parseTags(
      tags.map(tag => tag.replace(/[^a-z0-9]/gi, ' ')).map(tag => tag.split(' ').join('')),
      { spaceReplacer: '_' },
    ).map(tag => `#${tag}`);
  }

  private async uploadEmbeds(
    agent: BskyAgent,
    files: PostFileRecord[],
  ): Promise<AppBskyEmbedImages.Main | AppBskyEmbedVideo.Main> {
    // Bluesky supports either images or a video as an embed
    // GIFs must be treated as video on bsky
    var gifs: number = 0;
    for (const file of files) {
      if (file.file.options.filename.endsWith('.gif')) {
        ++gifs;
      }
    }

    if (this.countFileTypes(files).videos === 0 && gifs === 0) {
      const uploadedImages: AppBskyEmbedImages.Image[] = [];
      for (const file of files.slice(0, this.MAX_MEDIA)) {
        const altText = file.altText || '';
        const ref = await this.uploadImage(agent, file.file);

        uploadedImages.push({
          image: ref,
          alt: altText,
          aspectRatio: {
            height: file.file.options.height,
            width: file.file.options.width,
          },
        });
      }

      return {
        images: uploadedImages,
        $type: 'app.bsky.embed.images',
      };
    } else {
      for (const file of files) {
        if (file.type == FileSubmissionType.VIDEO || FileSubmissionType.IMAGE) {  // Only IMAGE file type left is a GIF
          const altText = file.altText || '';
          this.checkVideoUploadLimits(agent);
          const ref = await this.uploadVideo(agent, file.file);
          return {
            video: ref,
            alt: altText,
            $type: 'app.bsky.embed.video',
          };
        }
      }
    }
  }

  private async uploadImage(agent: BskyAgent, file: PostFile): Promise<BlobRef | undefined> {
    const blobUpload = await agent
      .uploadBlob(file.value, { encoding: file.options.contentType })
      .catch(err => {
        return Promise.reject(this.createPostResponse({}));
      });

    if (blobUpload.success) {
      // response has blob.ref
      return blobUpload.data.blob;
    }
  }

  // There's video methods in the API, but they are utterly non-functional in
  // many ways: wrong lexicon entries and overeager validation thereof that
  // prevents passing required parameters, picking the wrong host to upload to
  // (must be video.bsky.app, NOT some bsky.network host that'll just 404 at the
  // path) and not doing the proper service authentication dance. So we instead
  // follow what the website does here, which is the way that actually works.
  // We also use the same inconsistent header capitalization as they do.
  private async checkVideoUploadLimits(agent: BskyAgent): Promise<void> {
    const token = await this.getAuthToken(
      agent,
      'did:web:video.bsky.app',
      'app.bsky.video.getUploadLimits',
    );

    const url = 'https://video.bsky.app/xrpc/app.bsky.video.getUploadLimits';
    const req: RequestInit = {
      method: 'GET',
      headers: {
        Accept: '*/*',
        authorization: `Bearer ${token}`,
        'atproto-accept-labelers': 'did:plc:ar7c4by46qjdydhdevvrndac;redact',
      },
    };
    const uploadLimits: AppBskyVideoGetUploadLimits.OutputSchema = await this.checkFetchResult(
      fetch(url, req),
    ).catch(err => {
      this.logger.error(err);
      return Promise.reject(
        this.createPostResponse({ message: 'Getting video upload limits failed', error: err }),
      );
    });

    this.logger.debug(`Upload limits: ${JSON.stringify(uploadLimits)}`);
    if (!uploadLimits.canUpload) {
      return Promise.reject({ message: `Not allowed to upload: ${uploadLimits.message}` });
    }
  }

  private async uploadVideo(agent: BskyAgent, file: PostFile): Promise<BlobRef> {
    const token = await this.getAuthToken(
      agent,
      `did:web:${agent.pdsUrl.hostname}`,
      'com.atproto.repo.uploadBlob',
    );
    const did = encodeURIComponent(agent.did);
    const name = encodeURIComponent(this.generateVideoName());
    const url = `https://video.bsky.app/xrpc/app.bsky.video.uploadVideo?did=${did}&name=${name}`;
    const req: RequestInit = {
      method: 'POST',
      body: file.value,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': file.options.contentType,
      },
    };
    // Uploading an already-processed video returns 409 conflict, but a valid
    // response that contains a job id at top level.
    const videoUpload: any = await this.checkFetchResult(fetch(url, req), true).catch(err => {
      this.logger.error(err);
      return Promise.reject(
        this.createPostResponse({
          message: 'Checking video processing status failed',
          error: err,
        }),
      );
    });
    this.logger.debug(`Video upload: ${JSON.stringify(videoUpload)}`);
    return await this.waitForVideoProcessing(videoUpload?.jobStatus?.jobId || videoUpload.jobId);
  }

  private generateVideoName(): string {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let name = '';
    for (let i = 0; i < 12; ++i) {
      name += characters[Math.floor(Math.random() * characters.length)];
    }
    return name + '.mp4';
  }

  private async waitForVideoProcessing(jobId: string): Promise<BlobRef> {
    const encodedJobId = encodeURIComponent(jobId);
    const url = `https://video.bsky.app/xrpc/app.bsky.video.getJobStatus?jobId=${encodedJobId}`;
    let jobStatus: JobStatus;
    do {
      await WaitUtil.wait(4000);
      this.logger.debug(`Polling video processing status at ${url}`);
      const req: RequestInit = {
        method: 'GET',
        headers: {
          'atproto-accept-labelers': 'did:plc:ar7c4by46qjdydhdevvrndac;redact',
        },
      };
      const res: AppBskyVideoGetJobStatus.OutputSchema = await this.checkFetchResult(
        fetch(url, req),
      ).catch(err => {
        this.logger.error(err);
        return Promise.reject(
          this.createPostResponse({
            message: 'Checking video processing status failed',
            error: err,
          }),
        );
      });
      this.logger.debug(`Job status: ${JSON.stringify(res)}`);
      jobStatus = res.jobStatus;
    } while (jobStatus.state !== 'JOB_STATE_COMPLETED' && jobStatus.state !== 'JOB_STATE_FAILED');

    if (jobStatus.state === 'JOB_STATE_COMPLETED') {
      if (jobStatus.blob) {
        return jobStatus.blob;
      } else {
        return Promise.reject(
          this.createPostResponse({ message: 'No blob ref after video processing' }),
        );
      }
    } else {
      return Promise.reject(
        this.createPostResponse({ message: `Video processing failed: ${jobStatus.message}` }),
      );
    }
  }

  private async checkFetchResult(
    promise: Promise<Response>,
    allowConflict: boolean = false,
  ): Promise<any> {
    const res = await promise;
    if ((res.status >= 200 && res.status < 300) || (allowConflict && res.status === 409)) {
      try {
        const body = await res.json();
        return body;
      } catch (err) {
        return Promise.reject({ message: `Failed to get JSON body: ${err}` });
      }
    } else {
      const body = await this.tryGetErrorBody(res);
      return Promise.reject(`Failed with status ${res.status} ${res.statusText}: ${body})}`);
    }
  }

  private async getAuthToken(agent: BskyAgent, aud: string, lxm: string): Promise<string> {
    this.logger.debug(`Get auth token for ${aud}::${lxm}`);
    const auth = await agent.com.atproto.server.getServiceAuth({ aud, lxm }).catch(err => {
      this.logger.error(err);
      return Promise.reject(
        this.createPostResponse({ message: `Auth for ${aud}::${lxm} failed`, error: err }),
      );
    });
    if (!auth.success) {
      return Promise.reject(
        this.createPostResponse({ message: `Auth for ${aud}::${lxm} not successful` }),
      );
    }
    return auth.data.token;
  }

  private async tryGetErrorBody(res: Response): Promise<string> {
    try {
      const body = await res.text();
      return body;
    } catch (e) {
      return `(error getting body: ${e})`;
    }
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<BlueskyFileOptions>,
    accountData: BlueskyAccountData,
  ): Promise<PostResponse> {
    this.checkCancelled(cancellationToken);

    const agent = this.makeAgent();

    await agent.login({
      identifier: accountData.username,
      password: accountData.password,
    });

    let profile = await agent.getProfile({ actor: agent.session.did });

    const reply = await this.getReplyRef(agent, data.options.replyToUrl);

    const files = [data.primary, ...data.additional];
    const embeds = await this.uploadEmbeds(agent, files);

    let labelsRecord: ComAtprotoLabelDefs.SelfLabels | undefined;
    if (data.options.label_rating) {
      labelsRecord = {
        values: [{ val: data.options.label_rating }],
        $type: 'com.atproto.label.defs#selfLabels',
      };
    }

    const rt = new RichText({ text: data.description });
    await rt.detectFacets(agent);

    let postResult = await agent
      .post({
        text: rt.text,
        facets: rt.facets,
        embed: embeds,
        labels: labelsRecord,
        ...(reply ? { reply } : {}),
      })
      .catch(err => {
        return Promise.reject(this.createPostResponse({ message: err }));
      });

    if (postResult && postResult.uri) {
      // Generate a friendly URL
      const handle = profile.data.handle;
      const server = 'bsky.app'; // Can't use the agent sadly, but this might change later: agent.service.hostname;
      const postId = postResult.uri.slice(postResult.uri.lastIndexOf('/') + 1);

      let friendlyUrl = `https://${server}/profile/${handle}/post/${postId}`;

      // After the post has been made, check to see if we need to set a ThreadGate; these are the options to control who can reply to your post, and need additional calls
      if (data.options.threadgate) {
        this.createThreadgate(agent, postResult.uri, data.options.threadgate);
      }

      return this.createPostResponse({
        source: friendlyUrl,
      });
    } else {
      return Promise.reject(this.createPostResponse({ message: 'Unknown error occurred' }));
    }
  }

  createThreadgate(agent: BskyAgent, postUri: string, fromPostThreadGate: string) {
    let allow: (
      | AppBskyFeedThreadgate.MentionRule
      | AppBskyFeedThreadgate.FollowingRule
      | AppBskyFeedThreadgate.ListRule
    )[] = [];

    switch (fromPostThreadGate) {
      case 'mention':
        allow.push({ $type: 'app.bsky.feed.threadgate#mentionRule' });
        break;
      case 'following':
        allow.push({ $type: 'app.bsky.feed.threadgate#followingRule' });
        break;
      case 'mention,following':
        allow.push({ $type: 'app.bsky.feed.threadgate#followingRule' });
        allow.push({ $type: 'app.bsky.feed.threadgate#mentionRule' });
        break;
      default: // Leave the array empty and this sets no one - nobody mode
        break;
    }

    const postUrip = new AtUri(postUri);
    agent.api.app.bsky.feed.threadgate
      .create(
        { repo: agent.session!.did, rkey: postUrip.rkey },
        { post: postUri, createdAt: new Date().toISOString(), allow },
      )
      .finally(() => {
        return;
      });
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, BlueskyNotificationOptions>,
    accountData: BlueskyAccountData,
  ): Promise<PostResponse> {
    this.checkCancelled(cancellationToken);

    const agent = this.makeAgent();

    await agent.login({
      identifier: accountData.username,
      password: accountData.password,
    });

    let profile = await agent.getProfile({ actor: agent.session.did });

    const reply = await this.getReplyRef(agent, data.options.replyToUrl);

    let labelsRecord: ComAtprotoLabelDefs.SelfLabels | undefined;
    if (data.options.label_rating) {
      labelsRecord = {
        values: [{ val: data.options.label_rating }],
        $type: 'com.atproto.label.defs#selfLabels',
      };
    }

    const rt = new RichText({ text: data.description });
    await rt.detectFacets(agent);

    let postResult = await agent
      .post({
        text: rt.text,
        facets: rt.facets,
        labels: labelsRecord,
        ...(reply ? { reply } : {}),
      })
      .catch(err => {
        return Promise.reject(this.createPostResponse({ message: err }));
      });

    if (postResult && postResult.uri) {
      // Generate a friendly URL
      const handle = profile.data.handle;
      const server = 'bsky.app'; // Can't use the agent sadly, but this might change later: agent.service.hostname;
      const postId = postResult.uri.slice(postResult.uri.lastIndexOf('/') + 1);

      let friendlyUrl = `https://${server}/profile/${handle}/post/${postId}`;

      // After the post has been made, check to see if we need to set a ThreadGate; these are the options to control who can reply to your post, and need additional calls
      if (data.options.threadgate) {
        this.createThreadgate(agent, postResult.uri, data.options.threadgate);
      }

      return this.createPostResponse({
        source: friendlyUrl,
      });
    } else {
      return Promise.reject(this.createPostResponse({ message: 'Unknown error occurred' }));
    }
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<BlueskyFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    // count number of GIFs
    var gifs: number = 0;
    for (const file of files) {
      if (file.location.endsWith('.gif')) {
        gifs++;
      }
    }

    this.validateRating(submissionPart, defaultPart, warnings);

    this.validateDescription(problems, warnings, submissionPart, defaultPart);

    const { images, videos, other } = this.countFileTypes(files);

    // first condition also includes the case where there are gifs and videos
    if ((images !== 0 && videos !== 0) || (images > 1 && gifs !==0) || videos > 1 || gifs > 1 || other !== 0) {
      problems.push('Supports either a set of images, a single video, or a single GIF.');
    }

    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Does not support file format: (${name}) ${mimetype}.`);
      }

      let maxMB: number = 1;
      if (type !== FileSubmissionType.VIDEO && FileSize.MBtoBytes(maxMB) < size && (gifs === 0)) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`BlueSky limits ${mimetype} to ${maxMB}MB`);
        }
      }

      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        (file.height > 2000 || file.width > 2000)
      ) {
        warnings.push(`${name} will be scaled down to a maximum size of 2000x2000, while maintaining
            aspect ratio`);
      }
    });

    if (files.length > this.MAX_MEDIA) {
      warnings.push(
        'Too many files selected for this platform, only the first four will be posted',
      );
    }

    if (gifs > 0) {
      warnings.push(
        'Bluesky automatically converts GIFs to videos.'
      );
    }

    this.validateReplyToUrl(problems, submissionPart.data.replyToUrl);

    return { problems, warnings };
  }

  private countFileTypes(files: { type: FileSubmissionType }[]): {
    images: number;
    videos: number;
    other: number;
  } {
    const counts = { images: 0, videos: 0, other: 0 };
    for (const file of files) {
      if (file.type === FileSubmissionType.VIDEO) {
        ++counts.videos;
      } else if (file.type === FileSubmissionType.IMAGE) {
        ++counts.images;
      } else {
        ++counts.other;
      }
    }
    return counts;
  }

  validateNotificationSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<BlueskyNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    this.validateDescription(problems, warnings, submissionPart, defaultPart);
    this.validateReplyToUrl(problems, submissionPart.data.replyToUrl);
    this.validateRating(submissionPart, defaultPart, warnings);

    return { problems, warnings };
  }

  private validateRating(
    submissionPart: SubmissionPart<BlueskyFileOptions | BlueskyNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
    warnings: string[],
  ) {
    // Since bluesky rating is not mapped as other sited do
    // we should add warning, so users will not post unlabeled images
    const rating = submissionPart.data.rating || defaultPart.data.rating;
    if (rating) {
      // Dont really want to make warning for undefined rating
      // This is handled by default part validator
      if (!submissionPart.data.label_rating && rating !== SubmissionRating.GENERAL) {
        warnings.push(
          `Make sure that the Default rating '${
            rating ?? SubmissionRating.GENERAL
          }' matches Bluesky Label Rating.`,
        );
      }
    }
  }

  private validateDescription(
    problems: string[],
    warnings: string[],
    submissionPart: SubmissionPart<BlueskyNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): void {
    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    const rt = new RichText({ text: description });
    const agent = this.makeAgent();
    rt.detectFacets(agent);

    if (rt.graphemeLength > this.MAX_CHARS) {
      problems.push(`Max description length allowed is ${this.MAX_CHARS} characters.`);
    } else {
      if (description.toLowerCase().indexOf('{tags}') > -1) {
        this.validateInsertTags(
          warnings,
          this.formatTags(FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags)),
          description,
          this.MAX_CHARS,
          getRichTextLength,
        );
      } else {
        warnings.push(`You have not inserted the {tags} shortcut in your description;
          tags will not be inserted in your post`);
      }
    }
  }

  private validateReplyToUrl(problems: string[], url?: string): void {
    if (url?.trim() && !this.getPostIdFromUrl(url)) {
      problems.push('Invalid post URL to reply to.');
    }
  }

  private async getReplyRef(agent: BskyAgent, url?: string): Promise<ReplyRef | null> {
    if (!url?.trim()) {
      return null;
    }

    const postId = this.getPostIdFromUrl(url);
    if (!postId) {
      throw new Error(`Invalid reply to url '${url}'`);
    }

    // cf. https://atproto.com/blog/create-post#replies
    const parent = await agent.getPost(postId);
    const reply = parent.value.reply;
    const root = reply ? reply.root : parent;
    return {
      root: { uri: root.uri, cid: root.cid },
      parent: { uri: parent.uri, cid: parent.cid },
    };
  }

  private getPostIdFromUrl(url: string): { repo: string; rkey: string } | null {
    // A regular web link like https://bsky.app/profile/{repo}/post/{id}
    const link = /\/profile\/([^\/]+)\/post\/([a-zA-Z0-9\.\-_~]+)/.exec(url);
    if (link) {
      return { repo: link[1], rkey: link[2] };
    }

    // Protocol link like at://did:plc:{repo}/app.bsky.feed.post/{id}
    const at = /(did:plc:[a-zA-Z0-9\.\-_~]+)\/.+\.post\/([a-zA-Z0-9\.\-_~]+)/.exec(url);
    if (at) {
      return { repo: at[1], rkey: at[2] };
    }

    return null;
  }
}
