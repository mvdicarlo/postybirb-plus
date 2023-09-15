const MTProtoClass = require('@mtproto/core');
import { MTProto } from '@mtproto/core';
import { Injectable } from '@nestjs/common';
import cheerio from 'cheerio';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionType,
  TelegramAccountData,
  TelegramFileOptions,
  TelegramNotificationOptions,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server/account/models/user-account.entity';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import {
  FilePostData,
  PostFileRecord,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
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
  readonly acceptsFiles: string[] = [];
  private readonly instances: Record<string, MTProto> = {};
  private authData: Record<string, { phone_code_hash: string; phone_number: string }> = {};
  public acceptsAdditionalFiles = true;
  public waitBetweenPostsInterval = 30_000;
  private lastCall: number;
  private DEFAULT_WAIT: number = 3000;

  // Real telegram limit is 2GB but i don't think anyone
  // will send such big files throught PostyBirb because
  // no other site support such big files
  private MAX_MB: number = 30;
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

  public async authenticate(data: { appId: string; code: string; password: string }) {
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
      if (err.error_message.includes('SESSION_PASSWORD_NEEDED')) {
        if (!data.password)
          return {
            result: false,
            message: '2FA enabled, password required',
            passwordRequired: true,
          };

        const {
          srp_id,
          current_algo: { g, p, salt1, salt2 },
          srp_B,
        } = await this.callApi<{
          srp_id: string;
          current_algo: any;
          srp_B: string;
        }>(data.appId, 'account.getPassword', {});

        const { A, M1 } = await (this.instances[data.appId] as any).crypto.getSRPParams({
          g,
          p,
          salt1,
          salt2,
          gB: srp_B,
          password: data.password,
        });

        const signIn = await this.callApi<{ user?: { username?: string } }>(
          data.appId,
          'auth.checkPassword',
          {
            password: {
              _: 'inputCheckPasswordSRP',
              srp_id,
              A,
              M1,
            },
          },
        );

        this.usernameMap[data.appId] = signIn?.user?.username;
        return { result: true };
      }
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
        await WaitUtil.wait(1000);
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
            instance: new TelegramStorage(appId),
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
      chats: {
        _: string;
        creator: boolean;
        access_hash: string;
        title: string;
        id: number;
        left: boolean;
        deactivated: boolean;
        /**
         * Reverted default user rights.
         */
        default_banned_rights: {
          /**
           * So false means that the user
           * actually can send the media
           */
          send_media: boolean;
        };
        admin_rights: {
          post_messages: boolean;
        };
      }[];
    }>(appId, 'messages.getDialogs', {
      offset_peer: {
        _: 'inputPeerEmpty',
      },
      limit: 100,
    });

    const channels: Folder[] = chats
      .filter(c => {
        // Skip forbidden chats
        if (c.left || c.deactivated || !['channel', 'chat'].includes(c._)) return false;

        if (
          c.creator ||
          c.admin_rights?.post_messages ||
          // Reverted means that user can send media
          c.default_banned_rights?.send_media === false
        )
          return true;
      })
      .map(c => ({
        label: c.title,
        value: `${c.id}-${c.access_hash}`,
      }));

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, channels);
  }

  transformAccountData(data: object): object {
    return data;
  }

  parseDescription(text: string, type?: SubmissionType): string {
    // Actual parsing happens in post methods because we
    // need to get entities and split them
    return text;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(this.MAX_MB) };
  }

  private async upload(appId: string, file: PostFileRecord, spoiler: boolean) {
    const parts = _.chunk(file.file.value, FileSize.MBtoBytes(0.5)); // 512KB
    const file_id = Date.now();
    const type: 'photo' | 'document' =
      file.file.options.contentType === 'image/png' ||
      file.file.options.contentType === 'image/jpg' ||
      file.file.options.contentType === 'image/jpeg'
        ? 'photo'
        : 'document';

    // saveBigFile part is only needed for document (video, files etc)
    const bigFile = file.file.value.length >= FileSize.MBtoBytes(10) && type === 'document';

    let media: InputMedia = {
      _: `inputMediaUploaded${type === 'document' ? 'Document' : 'Photo'}`,
      spoiler,
    };

    if (type === 'document') {
      media.attributes = [];
      media.mime_type = file.file.options.contentType;
      if (media.mime_type === 'image/gif') {
        media.nosound_video = true;
      }
    }

    const total_parts = bigFile ? { file_total_parts: parts.length } : {};
    for (let i = 0; i < parts.length; i++) {
      await this.callApi(appId, `upload.save${bigFile ? 'Big' : ''}FilePart`, {
        ...total_parts,
        file_id,
        file_part: i,
        bytes: parts[i],
      });
    }

    media.file = {
      _: `inputFile${bigFile ? 'Big' : ''}`,
      id: file_id,
      parts: parts.length,
      name: file.file.options.filename,
    };

    return media;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<TelegramFileOptions>,
    accountData: TelegramAccountData,
  ): Promise<PostResponse> {
    const appId = accountData.appId;
    const files = [data.primary, ...data.additional];
    const medias: InputMedia[] = [];
    for (const file of files) {
      this.checkCancelled(cancellationToken);
      medias.push(await this.upload(appId, file, data.options.spoiler));
    }

    let response: SendMessageResponse;

    const { description, entities } = TelegramDescription.fromHTML(
      data.description.trim().slice(0, 4096),
    );
    let mediaDescription = '';
    let mediaEntities = [];
    let messageDescription = '';
    if (description.length < 1024) {
      // Description fit image/album limit, no separate message
      mediaDescription = description;
      mediaEntities = entities;
    } else {
      messageDescription = description;
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
        response = await this.callApi(appId, `messages.sendMedia`, {
          random_id: Date.now(),
          media: medias[0],
          message: mediaDescription,
          entities: mediaEntities,
          silent: data.options.silent,
          peer,
        });
      } else {
        let singleMedias: {
          _: 'inputSingleMedia';
          message: string;
          entities: any[];
          random_id: number;
          media: InputMedia;
        }[] = [];
        for (let i = 0; i < medias.length; i++) {
          const media = medias[i];
          const type = media._.includes('Document') ? 'document' : 'photo';
          const messageMedia = await this.callApi<{
            spoiler: boolean;
            ttl_seconds: number;
            document?: Input;
            photo?: Input;
          }>(appId, `messages.uploadMedia`, {
            media,
            peer,
          });
          const file = messageMedia.photo ?? messageMedia.document;
          singleMedias.push({
            _: 'inputSingleMedia',
            random_id: Date.now(),
            media: {
              ...media,
              _: type === 'photo' ? 'inputMediaPhoto' : 'inputMediaDocument',
              id: {
                _: type === 'photo' ? 'inputPhoto' : 'inputDocument',
                id: file.id,
                access_hash: file.access_hash,
                file_reference: file.file_reference,
              },
            },
            message: i === 0 ? mediaDescription : void 0,
            entities: i === 0 ? mediaEntities : void 0,
          });
        }

        const mediasPerBatch = 10;
        const batches = 1 + (singleMedias.length - 1) / mediasPerBatch;
        for (let i = 0; i < batches; i++) {
          response = await this.callApi(appId, 'messages.sendMultiMedia', {
            multi_media: singleMedias.slice(i * mediasPerBatch, (i + 1) * mediasPerBatch),
            silent: data.options.silent,
            peer,
          });
        }
      }

      // Send long description by separate message(s) after media
      if (messageDescription) {
        await this.callApi(accountData.appId, 'messages.sendMessage', {
          random_id: Date.now(),
          message: messageDescription,
          silent: data.options.silent,
          entities,
          peer,
        });
      }

      await WaitUtil.wait(1000);
    }

    return this.createPostResponse({ source: this.getSourceFromResponse(response) });
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, TelegramNotificationOptions>,
    accountData: TelegramAccountData,
  ) {
    let response: SendMessageResponse;
    const { description, entities } = TelegramDescription.fromHTML(
      data.description.trim().slice(0, 4096),
    );

    for (const channel of data.options.channels) {
      this.checkCancelled(cancellationToken);
      const [channel_id, access_hash] = channel.split('-');
      const peer = {
        _: 'inputPeerChannel',
        channel_id,
        access_hash,
      };
      response = await this.callApi(accountData.appId, 'messages.sendMessage', {
        random_id: Date.now(),
        message: description,
        entities: entities,
        silent: data.options.silent,
        peer,
      });

      await WaitUtil.wait(2000);
    }

    return this.createPostResponse({ source: this.getSourceFromResponse(response) });
  }

  private getSourceFromResponse(response: SendMessageResponse) {
    // TODO Maybe support multiple sources from multiple channels. Need to rewrite some ui
    const update = response.updates.find(e => e._ === 'updateNewChannelMessage');
    if (!update || !update.peer_id || !update.id) return '';
    return `https://t.me/c/${update.peer_id.channel_id}/${update.id}`;
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
      submissionPart.data.channels.forEach(f => {
        if (!WebsiteValidator.folderIdExists(f, folders)) {
          problems.push(`Channel (${f}) not found.`);
        }
      });
    } else {
      problems.push('No channel(s) selected.');
    }

    const { description } = TelegramDescription.fromHTML(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > 4096) {
      warnings.push('Max description length allowed is 4,096 characters.');
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      if (FileSize.MBtoBytes(this.MAX_MB) < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${this.MAX_MB}MB`);
        } else {
          problems.push(`Telegram limits ${mimetype} to ${this.MAX_MB}MB`);
        }
      }

      if (FileSize.MBtoBytes(10) < size && type !== FileSubmissionType.IMAGE) {
        warnings.push(
          `${name} will show in channel as Unknown Track but still will be available.`,
        );
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
          problems.push(`Channel (${f}) not found.`);
        }
      });
    } else {
      problems.push('No channel(s) selected.');
    }

    const { description } = TelegramDescription.fromHTML(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > 4096) {
      warnings.push('Max description length allowed is 4,096 characters.');
    }

    return { problems, warnings };
  }
}

interface InputMedia {
  _: `inputMedia${'Uploaded' | ''}${'Document' | 'Photo'}`;
  file?: {
    _: `inputFile${'Big' | ''}`;
    id: number;
    parts: number;
    name: string;
  };
  id?: Input;
  spoiler?: boolean;
  mime_type?: string;
  nosound_video?: boolean;
  attributes?: any[];
}

interface Input {
  _: `input${'Document' | 'Photo'}`;
  id: number;
  access_hash: number;
  file_reference: any;
}

interface SendMessageResponse {
  updates: { _: 'updateNewChannelMessage'; id: number; peer_id: { channel_id: number } }[];
}

type TelegramEntityParser = ({ node, output }: { node: cheerio.TagElement; output: string }) => any;

// Maybe move to parsers folder?
class TelegramDescription {
  private static parsers: Record<string, TelegramEntityParser> = {};
  public static entity(type: string, tags: string[], parse?: TelegramEntityParser) {
    if (!parse) {
      parse = ({ node, output }) => {
        return {
          _: `messageEntity${type}`,
          offset: output.length,
          length: 0,
        };
      };
    }
    for (const tag of tags) this.parsers[tag] = parse;
    return parse;
  }

  public static fromHTML(html: string) {
    let output = '';
    let entities: { _: string; offset: number; length: number }[] = [];

    const parseNodes = (doc: cheerio.Element[] | ReturnType<typeof $>, parent: number | null) => {
      for (const node of doc) {
        if (node.type === 'tag') {
          if (node.name === 'br') {
            output += '\n';
          } else {
            const parser = TelegramDescription.parsers[node.name];
            let index = null;
            if (parser) {
              index = entities.push(parser({ node, output })) - 1;
            }

            // Recurse parse other nodes
            if (node.children.length) parseNodes(node.children, index);
          }
        } else if (node.type === 'text') {
          output += node.data;
        }
      }

      // Set actual length of parent element if needed
      if (parent) {
        entities[parent].length = output.length - entities[parent].offset;
      }
    };

    const $ = cheerio.load('');
    parseNodes($(html), null);

    return { description: output, entities };
  }
}

TelegramDescription.entity('Bold', ['b', 'strong']);
TelegramDescription.entity('Underline', ['u', 'ins']);
TelegramDescription.entity('Strike', ['s', 'strike', 'del']);
TelegramDescription.entity('Italic', ['i', 'em']);
TelegramDescription.entity('Code', ['code']);
TelegramDescription.entity('Pre', ['pre']);
TelegramDescription.entity('TextUrl', ['a'], ({ node, output }) => {
  return {
    _: 'messageEntityTextUrl',
    offset: output.length,
    lenght: 0,
    url: node.attribs.href,
  };
});
