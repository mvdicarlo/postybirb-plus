import { MTProto } from '@mtproto/core';
import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
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

@Injectable()
export class Telegram extends Website {
  readonly BASE_URL: string;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly acceptsFiles: string[] = ['jpg', 'gif', 'png']; // TODO expand functionality here
  private readonly instances: Record<string, MTProto> = {};
  private authData: Record<string, { phone_code_hash: string; phone_number: string }> = {};
  acceptsAdditionalFiles = true;

  public authenticate(data: { appId: string; code: string }) {
    return this.instances[data.appId]
      .call('auth.signIn', {
        phone_number: this.authData[data.appId].phone_number,
        phone_code: data.code,
        phone_code_hash: this.authData[data.appId].phone_code_hash,
      })
      .then(() => true)
      .catch(err => {
        this.logger.error(err);
        return false;
      });
  }

  public async startAuthentication(data: TelegramAccountData) {
    await this.createInstance(data);
    const authData: { phone_code_hash: string } = (await this.instances[data.appId].call(
      'auth.sendCode',
      {
        phone_number: data.phoneNumber,
        settings: {
          _: 'codeSettings',
        },
      },
    )) as any;

    this.authData[data.appId] = {
      phone_code_hash: authData.phone_code_hash,
      phone_number: data.phoneNumber,
    };
  }

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const { appId }: TelegramAccountData = data.data;
    if (!this.instances[appId]) {
      await this.createInstance(data.data);
    }

    await this.loadChannels(data._id, appId);
    status.loggedIn = true;
    status.username = '<Your Telegram Account>';
    return status;
  }

  async createInstance(data: TelegramAccountData) {
    const { appId, appHash, phoneNumber }: TelegramAccountData = data;

    if (appId && appHash && phoneNumber) {
      if (!this.instances[appId]) {
        this.instances[appId] = new MTProto({
          api_id: Number(appId),
          api_hash: appHash,
          customLocalStorage: new TelegramStorage(appId),
        });

        this.instances[appId].setDefaultDc(
          await this.instances[appId]
            .call('help.getNearestDc', undefined)
            .then((result: { nearest_dc: number }) => result.nearest_dc),
        );
      }
    } else {
      throw new Error('Incomplete Telegram account data');
    }
  }

  private async loadChannels(profileId: string, appId: string) {
    await WaitUtil.wait(1000);
    const { chats } = (await this.instances[appId].call('messages.getAllChats', {
      except_ids: [],
    })) as { chats: { access_hash: string; title: string; id: number; _: string }[] };

    const channels: Folder[] = chats
      .filter(c => c._ === 'channel')
      .map(c => ({ label: c.title, value: `${c.id}-${c.access_hash}` }));

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, channels);
  }

  transformAccountData(data: object): object {
    return data;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return undefined;
  }

  private async upload(client: MTProto, file: PostFileRecord) {
    const parts = _.chunk(file.file.value, 512000); // 512KB
    const file_id = Date.now();
    if (file.file.value.length >= FileSize.MBtoBytes(10)) {
      // Big file path
      for (let i = 0; i < parts.length; i++) {
        await client.call('upload.saveBigFilePart', {
          file_id,
          file_part: i,
          file_total_parts: parts.length,
          bytes: parts[i],
        });

        WaitUtil.wait(1000); // Too much perhaps?
      }

      return {
        _: 'inputMediaUploadedPhoto',
        file: {
          _: 'inputFileBig',
          id: file_id,
          parts: parts.length,
          name: file.file.options.filename,
        },
      };
    } else {
      for (let i = 0; i < parts.length; i++) {
        await client.call('upload.saveFilePart', {
          file_id,
          file_part: i,
          bytes: parts[i],
        });

        WaitUtil.wait(1000); // Too much perhaps?
      }

      return {
        _: 'inputMediaUploadedPhoto',
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
    const client = this.instances[accountData.appId];
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
      fileData.push(await this.upload(client, file));
    }

    for (const channel of data.options.channels) {
      this.checkCancelled(cancellationToken);
      const [channel_id, access_hash] = channel.split('-');
      const peer = {
        _: 'inputPeerChannel',
        channel_id,
        access_hash,
      };
      if (files.length === 1) {
        await client.call('messages.sendMedia', {
          random_id: Date.now(),
          media: fileData[0],
          message: data.description,
          peer,
          silent: data.options.silent,
        });
      } else {
        // multimedia send
        const id = Date.now();
        for (let i = 0; i < fileData.length; i++) {
          await client.call('messages.sendMedia', {
            random_id: id + i,
            media: fileData[i],
            message: i === 0 ? data.description : '',
            peer,
            silent: data.options.silent,
          });
          await WaitUtil.wait(2000);
        }
        // await client.call('messages.sendMultiMedia', {
        //   peer,
        //   silent: data.options.silent,
        //   multi_media: [
        //     {
        //       _: 'inputSingleMedia',
        //       random_id: Date.now(),
        //       message: data.description,
        //       media: fileData[0],
        //     },
        //   ],
        // });
      }

      WaitUtil.wait(2000);
    }

    return this.createPostResponse({});
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, TelegramNotificationOptions>,
    accountData: TelegramAccountData,
  ) {
    const client = this.instances[accountData.appId];
    for (const channel of data.options.channels) {
      this.checkCancelled(cancellationToken);
      const [channel_id, access_hash] = channel.split('-');
      await client.call('messages.sendMessage', {
        random_id: Date.now(),
        message: data.description,
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

    if (submissionPart.data.channels?.length) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      submissionPart.data.channels.forEach(f => {
        if (!WebsiteValidator.folderIdExists(f, folders)) {
          problems.push(`Folder (${f}) not found.`);
        }
      });
    } else {
      problems.push('No channel(s) selected.');
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    let hasAddedProblem = false;
    files.forEach(file => {
      if (hasAddedProblem) {
        return;
      }
      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        hasAddedProblem = true;
      }
    });

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
      submissionPart.data.channels.forEach(f => {
        if (!WebsiteValidator.folderIdExists(f, folders)) {
          problems.push(`Folder (${f}) not found.`);
        }
      });
    } else {
      problems.push('No channel(s) selected.');
    }

    return { problems, warnings };
  }
}
