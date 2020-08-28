import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { session } from 'electron';
import * as _ from 'lodash';
import { EventsGateway } from 'src/server/events/events.gateway';
import { SubmissionPartService } from 'src/server/submission/submission-part/submission-part.service';
import { SubmissionTemplateService } from 'src/server/submission/submission-template/submission-template.service';
import { SubmissionService } from 'src/server/submission/submission.service';
import { LoginResponse } from 'src/server/websites/interfaces/login-response.interface';
import { WebsiteProvider } from 'src/server/websites/website-provider.service';
import { AccountRepository, AccountRepositoryToken } from './account.repository';
import { AccountEvent } from './enums/account.events.enum';
import { UserAccountDto } from './interfaces/user-account.dto.interface';
import UserAccountEntity from './models/user-account.entity';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  private readonly loginStatuses: UserAccountDto[] = [];
  private readonly loginCheckTimers: Record<number, any> = [];
  private readonly loginCheckMap: Record<number, string[]> = [];

  constructor(
    @Inject(AccountRepositoryToken)
    private readonly repository: AccountRepository,
    private readonly eventEmitter: EventsGateway,
    private readonly websiteProvider: WebsiteProvider,
    private readonly submissionPartService: SubmissionPartService,
    @Inject(forwardRef(() => SubmissionService))
    private readonly submissionService: SubmissionService,
    private readonly submissionTemplateService: SubmissionTemplateService,
  ) {
    this.repository
      .find()
      .then(results => {
        results.forEach(result => {
          this.loginStatuses.push({
            _id: result._id,
            alias: result.alias,
            website: result.website,
            loggedIn: false,
            username: null,
            data: {},
          });
        });
      })
      .finally(() => {
        Promise.all(this.loginStatuses.map(s => this.checkLogin(s._id))).finally(
          () => this.submissionService.postingStateChanged(), // Force updates to validation in case any website was slow
        );
      });

    this.websiteProvider.getAllWebsiteModules().forEach(website => {
      const { refreshInterval } = website;
      if (!this.loginCheckTimers[refreshInterval]) {
        this.loginCheckTimers[refreshInterval] = setInterval(async () => {
          const accountsToRefresh = await this.repository.find({
            website: { $in: this.loginCheckMap[refreshInterval] },
          });
          accountsToRefresh.forEach(account => this.checkLogin(account));
        }, refreshInterval);
      }

      this.loginCheckMap[refreshInterval] = this.loginCheckMap[refreshInterval] || [];
      this.loginCheckMap[refreshInterval].push(website.constructor.name);
    });
  }

  async clearCookiesAndData(id: string) {
    this.logger.log(id, 'Clearing Account Data');

    const ses = session.fromPartition(`persist:${id}`);
    const cookies = await ses.cookies.get({});
    if (cookies.length) {
      await ses.clearStorageData();
    }

    const data = await this.get(id);
    if (data && data.data && Object.keys(data.data)) {
      await this.setData(id, {});
    }

    this.checkLogin(id);
  }

  async createAccount(createAccount: UserAccountEntity) {
    this.logger.log(createAccount, 'Create Account');

    const existing: UserAccountEntity = await this.repository.findOne(createAccount._id);
    if (existing) {
      throw new BadRequestException(`Account with Id ${createAccount._id} already exists.`);
    }

    const account = await this.repository.save(createAccount);

    this.loginStatuses.push({
      _id: account._id,
      alias: account.alias,
      website: account.website,
      loggedIn: false,
      username: null,
      data: {},
    });

    this.eventEmitter.emit(AccountEvent.CREATED, createAccount._id);
    this.eventEmitter.emit(AccountEvent.STATUS_UPDATED, this.loginStatuses);
  }

  async get(id: string): Promise<UserAccountEntity> {
    const account = await this.repository.findOne(id);
    if (!account) {
      throw new NotFoundException(`Account ${id} does not exist.`);
    }
    return account;
  }

  getAll(): Promise<UserAccountEntity[]> {
    return this.repository.find();
  }

  getLoginStatuses(): UserAccountDto[] {
    return [...this.loginStatuses];
  }

  async removeAccount(id: string): Promise<void> {
    this.logger.log(id, 'Delete Account');

    await this.repository.remove(id);
    const index: number = this.loginStatuses.findIndex(s => s._id === id);
    if (index !== -1) {
      this.loginStatuses.splice(index, 1);
    }

    this.eventEmitter.emit(AccountEvent.DELETED, id);
    this.eventEmitter.emit(AccountEvent.STATUS_UPDATED, this.loginStatuses);

    session
      .fromPartition(`persist:${id}`)
      .clearStorageData()
      .then(() => this.logger.debug(`Session data for ${id} cleared`, 'Account'));

    await Promise.all([
      this.submissionPartService.removeAllSubmissionPartsForAccount(id),
      this.submissionTemplateService.removePartsForAccount(id),
    ]);

    this.submissionService.verifyAll();
  }

  async renameAccount(id: string, alias: string): Promise<void> {
    const account = await this.get(id);
    if (!alias) {
      throw new BadRequestException('No new alias provided');
    }

    account.alias = alias;
    await this.repository.update(account);
    this.loginStatuses.find(status => status._id === id).alias = alias;
    this.eventEmitter.emit(AccountEvent.STATUS_UPDATED, this.getLoginStatuses());
  }

  async checkLogin(userAccount: string | UserAccountEntity): Promise<UserAccountDto> {
    const account: UserAccountEntity =
      typeof userAccount === 'string' ? await this.repository.findOne(userAccount) : userAccount;
    if (!account) {
      throw new NotFoundException(`Account ID ${userAccount} does not exist.`);
    }

    this.logger.debug(account._id, 'Login Check');
    const website = this.websiteProvider.getWebsiteModule(account.website);
    let response: LoginResponse = { loggedIn: false, username: null };

    try {
      response = await website.checkLoginStatus(account);
    } catch (err) {
      this.logger.error(err, err.stack, `${account.website} Login Check Failure`);
    }

    const login: UserAccountDto = {
      _id: account._id,
      website: account.website,
      alias: account.alias,
      loggedIn: response.loggedIn,
      username: response.username,
      data: website.transformAccountData(account.data),
    };

    if (response.data && !_.isEqual(response.data, account.data)) {
      await this.setData(account._id, response.data);
    }

    this.insertOrUpdateLoginStatus(login);
    return login;
  }

  async setData(id: string, data: any): Promise<void> {
    this.logger.debug(id, 'Update Account Data');
    const entity = await this.get(id);
    entity.data = data;
    await this.repository.update(entity);
  }

  private async insertOrUpdateLoginStatus(login: UserAccountDto): Promise<void> {
    const index: number = this.loginStatuses.findIndex(s => s._id === login._id);
    this.loginStatuses[index] = login;
    this.eventEmitter.emit(AccountEvent.STATUS_UPDATED, this.getLoginStatuses());
  }
}
