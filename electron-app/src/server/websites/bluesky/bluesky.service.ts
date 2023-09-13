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
import {  BskyAgent, stringifyLex, jsonToLex, AppBskyEmbedImages, AppBskyRichtextFacet, ComAtprotoLabelDefs, BlobRef, RichText} from '@atproto/api';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import fetch from "node-fetch";
import Graphemer from 'graphemer';

// Start of Polyfill

const GET_TIMEOUT = 15e3; // 15s
const POST_TIMEOUT = 60e3; // 60s

interface FetchHandlerResponse {
  status: number;
  headers: Record<string, string>;
  body: ArrayBuffer | undefined;
}

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

    const files = [data.primary, ...data.additional];
    let uploadedMedias: AppBskyEmbedImages.Image[] = [];
    let fileCount = 0;
    for (const file of files) {
      const ref = await this.uploadMedia(agent, accountData, file.file, data.options.altText);
      const image: AppBskyEmbedImages.Image = { image: ref, alt: data.options.altText };
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

    let status = data.description;
    let r = new RichText({text: status});

    const tags = this.formatTags(data.tags);

    // Update the post content with the Tags if any are specified - for BlueSky (There is no tagging engine yet), we need to append
    // these onto the post, *IF* there is character count available.
    if (tags.length > 0) {
      status += '\n\n';
    }

    tags.forEach(tag => {
      let remain = this.MAX_CHARS - status.length;
      let tagToInsert = tag;
      if (!tag.startsWith('#')) {
        tagToInsert = `#${tagToInsert}`;
      }
      if (remain > tagToInsert.length) {
        status += ` ${tagToInsert}`;
      }
      // We don't exit the loop, so we can cram in every possible tag, even if there are short ones!
      r = new RichText({text: status});
    });

    let labelsRecord: ComAtprotoLabelDefs.SelfLabels | undefined;
    if (data.options.label_rating) {
      labelsRecord = {
        values: [{ val: data.options.label_rating }],
        $type: 'com.atproto.label.defs#selfLabels',
      };
    }

    const rt = new RichText({ text: status });
    await rt.detectFacets(agent);

    let postResult = await agent
      .post({
        text: rt.text,
        facets: rt.facets,
        embed: embeds,
        labels: labelsRecord,
      })
      .catch(err => {
        return Promise.reject(this.createPostResponse({ message: err }));
      });

    if (postResult && postResult.uri) {
      return this.createPostResponse({
        source: postResult.uri,
      });
    } else {
      return Promise.reject(this.createPostResponse({ message: 'Unknown error occurred' }));
    }
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

    let status = data.description;
    let r = new RichText({text: status});

    const tags = this.formatTags(data.tags);

    // Update the post content with the Tags if any are specified - for BlueSky (There is no tagging engine yet), we need to append
    // these onto the post, *IF* there is character count available.
    if (tags.length > 0) {
      status += '\n\n';
    }

    tags.forEach(tag => {
      let remain = this.MAX_CHARS - r.graphemeLength;
      let tagToInsert = tag;
      if (!tag.startsWith('#')) {
        tagToInsert = `#${tagToInsert}`;
      }
      if (remain > (tagToInsert.length)) {
        status += ` ${tagToInsert}`;
      }
      // We don't exit the loop, so we can cram in every possible tag, even if there are short ones!
      r = new RichText({text: status});
    });

    let labelsRecord: ComAtprotoLabelDefs.SelfLabels | undefined;
    if (data.options.label_rating) {
      labelsRecord = {
        values: [{ val: data.options.label_rating }],
        $type: 'com.atproto.label.defs#selfLabels',
      };
    }

    const rt = new RichText({ text: status });
    await rt.detectFacets(agent);
    
    let postResult = await agent.post({
      text: rt.text,
      facets: rt.facets,
      labels: labelsRecord
    }).catch(err => {
      return Promise.reject(
          this.createPostResponse({ message: err }),
      );
    });
  
    if (postResult && postResult.uri) {
      return this.createPostResponse({
        source: postResult.uri,
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

    if (!submissionPart.data.altText) {
      warnings.push(`Bluesky recommends alt text to be provided`);
    }

    const rt = new RichText({ text: submissionPart.data.description.value });
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    rt.detectFacets(agent);

    if (rt.graphemeLength > this.MAX_CHARS) {
      problems.push(
        `Max description length allowed is ${this.MAX_CHARS} graphemes.`,
      );
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

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

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<BlueskyNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    const rt = new RichText({ text: submissionPart.data.description.value });
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    rt.detectFacets(agent);

    if (rt.graphemeLength > this.MAX_CHARS) {
      problems.push(
        `Max description length allowed is ${this.MAX_CHARS} graphemes.`,
      );
    }

    return { problems, warnings };
  }
}
