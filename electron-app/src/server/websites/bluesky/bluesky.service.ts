import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PostResponse,
  Submission,
  SubmissionPart,
  BlueskyAccountData,
  BlueskyFileOptions,
  BlueskyNotificationOptions,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import {
  FilePostData,
  PostFile,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { BskyAgent, stringifyLex, jsonToLex, AppBskyEmbedImages, ComAtprotoLabelDefs, BlobRef, RichText, AppBskyFeedThreadgate, AtUri } from '@atproto/api';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import fetch from "node-fetch";
import { ReplyRef } from '@atproto/api/dist/client/types/app/bsky/feed/post';
import FormContent from 'src/server/utils/form-content.util';

// Start of Polyfill

const GET_TIMEOUT = 15e3; // 15s
const POST_TIMEOUT = 60e3; // 60s

interface FetchHandlerResponse {
  status: number;
  headers: Record<string, string>;
  body: ArrayBuffer | undefined;
}

type ThreadgateSetting =
  | {type: 'nobody'}
  | {type: 'mention'}
  | {type: 'following'}
  | {type: 'list'; list: string};

async function fetchHandler(
  reqUri: string,
  reqMethod: string,
  reqHeaders: Record<string, string>,
  reqBody: any,
): Promise<FetchHandlerResponse> {
  const reqMimeType = reqHeaders['Content-Type'] || reqHeaders['content-type'];
  if (reqMimeType && reqMimeType.startsWith('application/json')) {
    reqBody = stringifyLex(reqBody);
  } else if (
    typeof reqBody === 'string' &&
    (reqBody.startsWith('/') || reqBody.startsWith('file:'))
  ) {
    // if (reqBody.endsWith('.jpeg') || reqBody.endsWith('.jpg')) {
    //   // HACK
    //   // React native has a bug that inflates the size of jpegs on upload
    //   // we get around that by renaming the file ext to .bin
    //   // see https://github.com/facebook/react-native/issues/27099
    //   // -prf
    //   const newPath = reqBody.replace(/\.jpe?g$/, '.bin')
    //   await RNFS.moveFile(reqBody, newPath)
    //   reqBody = newPath
    // }
    // NOTE
    // React native treats bodies with {uri: string} as file uploads to pull from cache
    // -prf
    reqBody = { uri: reqBody };
  }

  const controller = new AbortController();
  const to = setTimeout(
    () => controller.abort(),
    reqMethod === 'post' ? POST_TIMEOUT : GET_TIMEOUT,
  );

  const res = await fetch(reqUri, {
    method: reqMethod,
    headers: reqHeaders,
    body: reqBody,
    signal: controller.signal,
  });

  const resStatus = res.status;
  const resHeaders: Record<string, string> = {};
  res.headers.forEach((value: string, key: string) => {
    resHeaders[key] = value;
  });
  const resMimeType = resHeaders['Content-Type'] || resHeaders['content-type'];
  let resBody;
  if (resMimeType) {
    if (resMimeType.startsWith('application/json')) {
      resBody = jsonToLex(await res.json());
    } else if (resMimeType.startsWith('text/')) {
      resBody = await res.text();
    } else {
      resBody = await res.blob();
    }
  }

  clearTimeout(to);

  return {
    status: resStatus,
    headers: resHeaders,
    body: resBody,
  };
}

// End of Polyfill

function getRichTextLength(text: string): number {
  return new RichText({text}).graphemeLength;
}

@Injectable()
export class Bluesky extends Website {
  readonly BASE_URL = '';
  readonly acceptsFiles = ['png', 'jpeg', 'jpg', 'gif'];
  readonly acceptsAdditionalFiles = true;
  readonly refreshInterval = 45 * 60000;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly MAX_CHARS = 300;
  readonly MAX_MEDIA = 4;
  readonly enableAdvertisement = false;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    BskyAgent.configure({ fetch: fetchHandler });

    const status: LoginResponse = { loggedIn: false, username: null };
    const agent = new BskyAgent({ service: 'https://bsky.social' });

    await agent
      .login({
        identifier: data.data.username,
        password: data.data.password,
      })
      .then(res => {
        if (res.success) {
          status.loggedIn = true;
          status.username = data.data.username;
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
      maxSize: FileSize.MBtoBytes(0.9),
    };
  }

  formatTags(tags: string[]) {
    return this.parseTags(
      tags.map(tag => tag.replace(/[^a-z0-9]/gi, ' ')).map(tag => tag.split(' ').join('')),
      { spaceReplacer: '_' },
    ).map(tag => `#${tag}`);
  }

  private async uploadMedia(
    agent: BskyAgent,
    data: BlueskyAccountData,
    file: PostFile,
    altText: string,
  ): Promise<BlobRef | undefined> {
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

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<BlueskyFileOptions>,
    accountData: BlueskyAccountData,
  ): Promise<PostResponse> {
    this.checkCancelled(cancellationToken);

    const agent = new BskyAgent({ service: 'https://bsky.social' });

    await agent.login({
      identifier: accountData.username,
      password: accountData.password,
    });

    let profile = await agent.getProfile({actor: agent.session.did });

    const reply = await this.getReplyRef(agent, data.options.replyToUrl);

    const files = [data.primary, ...data.additional];
    let uploadedMedias: AppBskyEmbedImages.Image[] = [];
    let fileCount = 0;
    for (const file of files) {
      const altText = file.altText || data.options.altText;
      const ref = await this.uploadMedia(agent, accountData, file.file, altText);
      const image: AppBskyEmbedImages.Image = { image: ref, alt: altText };
      uploadedMedias.push(image);
      fileCount++;
      if (fileCount == this.MAX_MEDIA) {
        break;
      }
    }

    const embeds: AppBskyEmbedImages.Main = {
      images: uploadedMedias,
      $type: 'app.bsky.embed.images',
    };

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
      const server = "bsky.app"; // Can't use the agent sadly, but this might change later: agent.service.hostname;
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

  createThreadgate(
    agent: BskyAgent,
    postUri: string,
    fromPostThreadGate: string,
  ) {
    let allow: (
      | AppBskyFeedThreadgate.MentionRule
      | AppBskyFeedThreadgate.FollowingRule
      | AppBskyFeedThreadgate.ListRule
    )[] = []

    switch (fromPostThreadGate) {
      case "mention":
        allow.push({$type: 'app.bsky.feed.threadgate#mentionRule'});
        break;
      case "following":
        allow.push({$type: 'app.bsky.feed.threadgate#followingRule'});
        break;
      case "mention,following":
        allow.push({$type: 'app.bsky.feed.threadgate#followingRule'});
        allow.push({$type: 'app.bsky.feed.threadgate#mentionRule'});
        break;      
      default: // Leave the array empty and this sets no one - nobody mode
        break;
    } 

    const postUrip = new AtUri(postUri)
    agent.api.app.bsky.feed.threadgate.create(
      {repo: agent.session!.did, rkey: postUrip.rkey},
      {post: postUri, createdAt: new Date().toISOString(), allow},
    ).finally(() => {
      return;
    })
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, BlueskyNotificationOptions>,
    accountData: BlueskyAccountData,
  ): Promise<PostResponse> {
    this.checkCancelled(cancellationToken);

    const agent = new BskyAgent({ service: 'https://bsky.social' });

    await agent.login({
      identifier: accountData.username,
      password: accountData.password,
    });

    let profile = await agent.getProfile({actor: agent.session.did });

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
    
    let postResult = await agent.post({
      text: rt.text,
      facets: rt.facets,
      labels: labelsRecord,
      ...(reply ? { reply } : {}),
    }).catch(err => {
      return Promise.reject(
          this.createPostResponse({ message: err }),
      );
    });
  
    if (postResult && postResult.uri) {
      // Generate a friendly URL
      const handle = profile.data.handle;
      const server = "bsky.app"; // Can't use the agent sadly, but this might change later: agent.service.hostname;
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
    if (!submissionPart.data.altText && files.some(f => !f.altText)) {
      problems.push(
        'Bluesky currently always requires alt text to be provided, ' +
          'even if your settings say otherwise. This is a bug on their side.',
      );
    }

    this.validateDescription(problems, warnings, submissionPart, defaultPart);

    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Does not support file format: (${name}) ${mimetype}.`);
      }

      let maxMB: number = 1;
      if (FileSize.MBtoBytes(maxMB) < size) {
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

    this.validateReplyToUrl(problems, submissionPart.data.replyToUrl);

    return { problems, warnings };
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

    return { problems, warnings };
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
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    rt.detectFacets(agent);

    if (rt.graphemeLength > this.MAX_CHARS) {
      problems.push(
        `Max description length allowed is ${this.MAX_CHARS} characters.`,
      );
    } else {
      if (description.toLowerCase().indexOf('{tags}') > -1) {
        this.validateInsertTags(
          warnings,
          this.formatTags(FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags)),
          description,
          this.MAX_CHARS,
          getRichTextLength,
        );
      }
    }
  }

  private validateReplyToUrl(problems: string[], url?: string): void {
    if(url?.trim() && !this.getPostIdFromUrl(url)) {
      problems.push("Invalid post URL to reply to.");
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
