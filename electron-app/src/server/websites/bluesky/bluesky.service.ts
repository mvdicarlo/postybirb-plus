import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
  BlueskyAccountData,
  BlueskyFileOptions,
  BlueskyNotificationOptions,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import {  BskyAgent, stringifyLex, jsonToLex } from '@atproto/api';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import fetch from "node-fetch";
import { error } from 'console';

 // Start of Polyfill

 const GET_TIMEOUT = 15e3 // 15s
 const POST_TIMEOUT = 60e3 // 60s

 interface FetchHandlerResponse {
  status: number
  headers: Record<string, string>
  body: ArrayBuffer | undefined
}

async function fetchHandler(
  reqUri: string,
  reqMethod: string,
  reqHeaders: Record<string, string>,
  reqBody: any,
): Promise<FetchHandlerResponse> {
  const reqMimeType = reqHeaders['Content-Type'] || reqHeaders['content-type']
  if (reqMimeType && reqMimeType.startsWith('application/json')) {
    reqBody = stringifyLex(reqBody)
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
    reqBody = { uri: reqBody }
  }

  const controller = new AbortController()
  const to = setTimeout(
    () => controller.abort(),
    reqMethod === 'post' ? POST_TIMEOUT : GET_TIMEOUT,
  )

  const res = await fetch(reqUri, {
    method: reqMethod,
    headers: reqHeaders,
    body: reqBody,
    signal: controller.signal,
  })

  const resStatus = res.status
  const resHeaders: Record<string, string> = {}
  res.headers.forEach((value: string, key: string) => {
    resHeaders[key] = value
  })
  const resMimeType = resHeaders['Content-Type'] || resHeaders['content-type']
  let resBody
  if (resMimeType) {
    if (resMimeType.startsWith('application/json')) {
      resBody = jsonToLex(await res.json())
    } else if (resMimeType.startsWith('text/')) {
      resBody = await res.text()
    } else {
      resBody = await res.blob()
    }
  }

  clearTimeout(to)

  return {
    status: resStatus,
    headers: resHeaders,
    body: resBody,
  }
}

  // End of Polyfill

@Injectable()
export class Bluesky extends Website {
  readonly BASE_URL = '';
  readonly acceptsFiles = ['png', 'jpeg', 'jpg', 'gif'];
  readonly acceptsAdditionalFiles = false;
  readonly refreshInterval = 45 * 60000;
  readonly defaultDescriptionParser = PlaintextParser.parse;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    BskyAgent.configure({fetch: fetchHandler});

    const status: LoginResponse = { loggedIn: false, username: null };
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    
    await agent.login({
      identifier: data.data.username,
      password: data.data.password,
    }).then(res => {
      if (res.success) { 
        status.loggedIn = true;
        status.username = data.data.username;
      } else {
        status.loggedIn = false;
      }
    }).catch(error => {
      status.loggedIn = false;
      this.logger.error(error);
    })
  
    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(10) };
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<BlueskyFileOptions>,
    accountData: BlueskyAccountData,
  ): Promise<PostResponse> {

    this.checkCancelled(cancellationToken);



    // const post = await Http.post<{ success: boolean; data: { id_string: string }; error: string }>(
    //   OAuthUtil.getURL('tumblr/v2/post'),
    //   undefined,
    //   {
    //     type: 'json',
    //     data: form,
    //     requestOptions: { json: true },
    //   },
    // );

    // if (post.body.success) {
    //   return this.createPostResponse({
    //     source: `https://${form.options.blog}.tumblr.com/post/${post.body.data.id_string}/`,
    //   });
    // }

    // return Promise.reject(
    //   this.createPostResponse({ additionalInfo: post.body, message: post.body.error }),
    // );

    return Promise.reject(
      this.createPostResponse({  }),
    );
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, BlueskyNotificationOptions>,
    accountData: BlueskyAccountData,
  ): Promise<PostResponse> {

    this.checkCancelled(cancellationToken);

    const postData = data.description;

    const agent = new BskyAgent({ service: 'https://bsky.social' })

    await agent.login({
      identifier: accountData.username,
      password: accountData.password,
    });

    let postResult = await agent.post({
      text: postData
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
      return Promise.reject(
        this.createPostResponse({ message: "Unknown error occurred" }),
      );
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

    // const files = [
    //   submission.primary,
    //   ...(submission.additional || []).filter(
    //     f => !f.ignoredAccounts!.includes(submissionPart.accountId),
    //   ),
    // ];

    // files.forEach(file => {
    //   const { type, size, name, mimetype } = file;
    //   if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
    //     problems.push(`Does not support file format: (${name}) ${mimetype}.`);
    //   }

    //   let maxMB: number = 10;
    //   if (type === FileSubmissionType.IMAGE && mimetype === 'image/gif') {
    //     maxMB = 10;
    //   } else if (type === FileSubmissionType.VIDEO) {
    //     maxMB = 100;
    //   }
    //   if (FileSize.MBtoBytes(maxMB) < size) {
    //     if (
    //       isAutoscaling &&
    //       type === FileSubmissionType.IMAGE &&
    //       ImageManipulator.isMimeType(mimetype)
    //     ) {
    //       warnings.push(`${name} will be scaled down to ${maxMB}MB`);
    //     } else {
    //       problems.push(`Tumblr limits ${mimetype} to ${maxMB}MB`);
    //     }
    //   }
    // });

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<BlueskyNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    if (submissionPart.data.description.value.length > 300) {
      problems.push(
        `Max description length allowed is 300 characters.`,
      );
    }

    return { problems, warnings };
  }
}
