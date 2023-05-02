const MTProtoClass = require('@mtproto/core');
import { MTProto } from '@mtproto/core'
import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PostResponse,
  Submission,
  SubmissionPart,
  TelegramAccountData,
  TelegramFileOptions,
  TelegramNotificationOptions,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server/account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import {
  FilePostData,
  PostFileRecord,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import WaitUtil from 'src/server/utils/wait.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { TelegramStorage } from './telegram.storage';
import _ = require('lodash');
import FormContent from 'src/server/utils/form-content.util';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';

@Injectable()
export class Telegram extends Website {
  readonly BASE_URL: string;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly acceptsFiles: string[] = [];
  private readonly instances: Record<string, MTProto> = {};
  private authData: Record<string, { phone_code_hash: string; phone_number: string }> = {};
  public acceptsAdditionalFiles = true;
  public waitBetweenPostsInterval = 30_000;
  private lastCall: number;
  private DEFAULT_WAIT: number = 3000;
  private usernameMap: Record<string, string> = {};

  private async callApi<T>(appId: string, protocol: string, data: any): Promise<T> {
    if (this.lastCall) {
      const now = Date.now();
      if (now - this.lastCall <= this.DEFAULT_WAIT) {
        await WaitUtil.wait(Math.max(this.DEFAULT_WAIT - (now - this.lastCall), 1000));
      }
    }

    this.logger.debug(`Calling: ${protocol}`);

    let res: any;
    let resErr: any;
    try {
      this.lastCall = Date.now(); // Cautious set in case anything unexpected happens
      res = await this.instances[appId].call(protocol, data);
    } catch (err) {
      this.logger.error(err);
      if (err?.error_message?.startsWith('FLOOD_WAIT')) {
        const wait = Number(err.error_message.split('_').pop());
        if (wait > 60) {
          // Too long of a wait
          this.logger.error('Telegram wait period exceeded limit.');
          this.logger.error(err, undefined, `TelegramAPIWaited:${protocol}`);
          resErr = err;
        } else {
          try {
            await WaitUtil.wait(1000 * (wait + 1)); // Wait timeout + 1 second
            res = (await (this.instances[appId].call(protocol, data) as unknown)) as T;
          } catch (waitErr) {
            this.logger.error(waitErr, undefined, `TelegramAPIWaited:${protocol}`);
            resErr = waitErr;
          }
        }
      } else {
        resErr = err;
      }
    }

    this.lastCall = Date.now();
    return resErr ? Promise.reject(resErr) : (res as T);
  }

  public async authenticate(data: { appId: string; code: string }) {
    try {
      const signIn: any = await this.callApi(data.appId, 'auth.signIn', {
        phone_number: this.authData[data.appId].phone_number,
        phone_code: data.code,
        phone_code_hash: this.authData[data.appId].phone_code_hash,
      });
      this.usernameMap[data.appId] = signIn?.user?.username;
      return { result: true };
    } catch (err) {
      this.logger.error(err);
      return { result: false, message: err.error_message };
    }
  }

  public async startAuthentication(data: TelegramAccountData) {
    this.logger.log('Starting Authentication');
    try {
      await this.createInstance(data);
      await this.callApi(data.appId, 'auth.logOut', undefined);
      const authData = await this.callApi<{ phone_code_hash: string }>(
        data.appId,
        'auth.sendCode',
        {
          phone_number: data.phoneNumber,
          settings: {
            _: 'codeSettings',
          },
        },
      );

      this.authData[data.appId] = {
        phone_code_hash: authData.phone_code_hash,
        phone_number: data.phoneNumber,
      };
    } catch (err) {
      this.logger.error(err);
      if (err.error_message.includes('PHONE_MIGRATE')) {
        WaitUtil.wait(1000);
        await this.instances[data.appId].setDefaultDc(Number(err.error_message.split('_').pop()));
        const authData = await this.callApi<{ phone_code_hash: string }>(
          data.appId,
          'auth.sendCode',
          {
            phone_number: data.phoneNumber,
            settings: {
              _: 'codeSettings',
            },
          },
        );

        this.authData[data.appId] = {
          phone_code_hash: authData.phone_code_hash,
          phone_number: data.phoneNumber,
        };
      } else {
        throw err;
      }
    }
  }

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const { appId }: TelegramAccountData = data.data;
    if (!this.instances[appId]) {
      await this.createInstance(data.data);
    }

    await this.loadChannels(data._id, appId);
    status.loggedIn = true;
    status.username = data.data.username || this.usernameMap[appId] || '<Your Telegram Account>';
    // Roundabout way to set username and save it after authentication
    if (this.usernameMap[appId]) {
      status.data = {
        ...data.data,
        username: this.usernameMap[appId],
      };
    }
    return status;
  }

  async createInstance(data: TelegramAccountData) {
    const { appId, appHash, phoneNumber }: TelegramAccountData = data;

    if (appId && appHash && phoneNumber) {
      if (!this.instances[appId]) {
        this.instances[appId] = new MTProtoClass({
          api_id: Number(appId),
          api_hash: appHash,
          storageOptions: {
            instance: new TelegramStorage(appId)
          },
        });

        // COMMENTED OUT SINCE IT MIGHT BE BETTER TO CATCH THIS AND SET DURING AUTH TIME
        // this.instances[appId].setDefaultDc(
        //   await this.instances[appId]
        //     .call('help.getNearestDc', undefined)
        //     .then((result: { nearest_dc: number }) => result.nearest_dc),
        // );
      }
    } else {
      throw new Error('Incomplete Telegram account data');
    }
  }

  private async loadChannels(profileId: string, appId: string) {
    const { chats } = await this.callApi<{
      chats: { access_hash: string; title: string; id: number; _: string }[];
    }>(appId, 'messages.getDialogs', {
        offset_peer: {
          _: 'inputPeerEmpty'
      }      
    });

    const channels: Folder[] = chats
      .filter((c) => c._ === 'channel')
      .map((c) => ({ label: c.title, value: `${c.id}-${c.access_hash}` }));

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, channels);
  }

  transformAccountData(data: object): object {
    return data;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(10) };
  }

  private async upload(appId: string, file: PostFileRecord) {
    const parts = _.chunk(file.file.value, 512000); // 512KB
    const file_id = Date.now();
    const props: {
      _: 'inputMediaUploadedDocument' | 'inputMediaUploadedPhoto';
      mime_type?: string;
      nosound_video?: boolean;
      attributes?: any[];
    } = {
      _: 'inputMediaUploadedDocument',
    };
    if (
      file.file.options.contentType === 'image/png' ||
      file.file.options.contentType === 'image/jpg' ||
      file.file.options.contentType === 'image/jpeg'
    ) {
      props._ = 'inputMediaUploadedPhoto';
    } else {
      props.attributes = [];
      props.mime_type = file.file.options.contentType;
      if (props.mime_type === 'image/gif') {
        props.nosound_video = true;
      }
    }

    if (file.file.value.length >= FileSize.MBtoBytes(10)) {
      // Big file path
      for (let i = 0; i < parts.length; i++) {
        await this.callApi(appId, 'upload.saveBigFilePart', {
          file_id,
          file_part: i,
          file_total_parts: parts.length,
          bytes: parts[i],
        });

        WaitUtil.wait(1000); // Too much perhaps?
      }

      return {
        ...props,
        file: {
          _: 'inputFileBig',
          id: file_id,
          parts: parts.length,
          name: file.file.options.filename,
        },
      };
    } else {
      for (let i = 0; i < parts.length; i++) {
        await this.callApi(appId, 'upload.saveFilePart', {
          file_id,
          file_part: i,
          bytes: parts[i],
        });

        WaitUtil.wait(1000); // Too much perhaps?
      }

      return {
        ...props,
        file: {
          _: 'inputFile',
          id: file_id,
          parts: parts.length,
          name: file.file.options.filename,
        },
      };
    }
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<TelegramFileOptions>,
    accountData: TelegramAccountData,
  ): Promise<PostResponse> {
    const appId = accountData.appId;
    const files = [data.primary, ...data.additional];
    const fileData: {
      _: string;
      file: {
        _: string;
        id: number;
        parts: number;
        name: string;
      };
    }[] = [];
    for (const file of files) {
      this.checkCancelled(cancellationToken);
      fileData.push(await this.upload(appId, file));
    }

    const description = data.description.slice(0, 4096).trim();

    for (const channel of data.options.channels) {
      this.checkCancelled(cancellationToken);
      const [channel_id, access_hash] = channel.split('-');
      const peer = {
        _: 'inputPeerChannel',
        channel_id,
        access_hash,
      };
      if (files.length === 1) {
        let messagePosted = false;
        if (description.length > 1024) {
          messagePosted = true;
          await this.callApi(accountData.appId, 'messages.sendMessage', {
            random_id: Date.now(),
            message: data.description.slice(0, 4096).trim(),
            peer: {
              _: 'inputPeerChannel',
              channel_id,
              access_hash,
            },
          });
        }
        await this.callApi(appId, 'messages.sendMedia', {
          random_id: Date.now(),
          media: fileData[0],
          message: messagePosted ? '' : data.description,
          peer,
          silent: data.options.silent,
        });
      } else {
        let messagePosted = false;
        if (description.length > 1024) {
          messagePosted = true;
          await this.callApi(accountData.appId, 'messages.sendMessage', {
            random_id: Date.now(),
            message: data.description.slice(0, 4096).trim(),
            peer: {
              _: 'inputPeerChannel',
              channel_id,
              access_hash,
            },
          });
        }

        // multimedia send
        const id = Date.now();
        for (let i = 0; i < fileData.length; i++) {
          await this.callApi(appId, 'messages.sendMedia', {
            random_id: id + i,
            media: fileData[i],
            message: messagePosted ? '' : i === 0 ? data.description : '',
            peer,
            silent: data.options.silent,
          });
          await WaitUtil.wait(1000);
        }
      }

      WaitUtil.wait(1000);
    }

    return this.createPostResponse({});
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, TelegramNotificationOptions>,
    accountData: TelegramAccountData,
  ) {
    for (const channel of data.options.channels) {
      this.checkCancelled(cancellationToken);
      const [channel_id, access_hash] = channel.split('-');
      await this.callApi(accountData.appId, 'messages.sendMessage', {
        random_id: Date.now(),
        message: data.description.slice(0, 4096).trim(),
        peer: {
          _: 'inputPeerChannel',
          channel_id,
          access_hash,
        },
      });

      await WaitUtil.wait(2000);
    }

    return this.createPostResponse({});
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<TelegramFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (submissionPart.data.channels?.length) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      submissionPart.data.channels.forEach((f) => {
        if (!WebsiteValidator.folderIdExists(f, folders)) {
          problems.push(`Channel (${f}) not found.`);
        }
      });
    } else {
      problems.push('No channel(s) selected.');
    }

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > 4096) {
      warnings.push('Max description length allowed is 4,096 characters.');
    }

    const { type, size, name } = submission.primary;
    const maxMB: number = 10;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Telegram limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<TelegramNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    if (submissionPart.data.channels?.length) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      submissionPart.data.channels.forEach((f) => {
        if (!WebsiteValidator.folderIdExists(f, folders)) {
          problems.push(`Folder (${f}) not found.`);
        }
      });
    } else {
      problems.push('No channel(s) selected.');
    }

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > 4096) {
      warnings.push('Max description length allowed is 4,096 characters.');
    }

    return { problems, warnings };
  }
}
