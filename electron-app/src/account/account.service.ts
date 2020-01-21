import { Injectable, Logger, BadRequestException, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { EventsGateway } from 'src/events/events.gateway';
import { LoginResponse } from 'src/websites/interfaces/login-response.interface';
import { WebsiteProvider } from 'src/websites/website-provider.service';
import { session } from 'electron';
import { SubmissionPartService } from 'src/submission/submission-part/submission-part.service';
import { AccountEvent } from './enums/account.events.enum';
import { SubmissionService } from 'src/submission/submission.service';
import { SubmissionTemplateService } from 'src/submission/submission-template/submission-template.service';
import UserAccountEntity from './models/user-account.entity';
import { UserAccountDto } from './interfaces/user-account.dto.interface';

// TODO ability to update alias
@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  private readonly loginStatuses: UserAccountDto[] = [];
  private readonly loginCheckTimers: { [key: number]: any } = [];
  private readonly loginCheckMap: { [key: number]: string[] } = [];

  constructor(
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
            data: result.data,
          });
        });
      })
      .finally(() => {
        this.loginStatuses.forEach(s => this.checkLogin(s._id));
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
      data: account.data,
    });

    this.eventEmitter.emit(AccountEvent.CREATED, createAccount._id);
    this.eventEmitter.emit(AccountEvent.STATUS_UPDATED, this.loginStatuses);
    this.eventEmitter.emitOnComplete(AccountEvent.UPDATED, this.repository.find());
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
    this.eventEmitter.emit(AccountEvent.UPDATED, await this.repository.find());

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

  async checkLogin(userAccount: string | UserAccountEntity): Promise<UserAccountDto> {
    const account: UserAccountEntity =
      typeof userAccount === 'string' ? await this.repository.findOne(userAccount) : userAccount;
    if (!account) {
      throw new NotFoundException(`Account ID ${userAccount} does not exist.`);
    }

    this.logger.debug(account._id, 'Login Check');
    const website = this.websiteProvider.getWebsiteModule(account.website);
    const response: LoginResponse = await website.checkLoginStatus(account);

    const login: UserAccountDto = {
      _id: account._id,
      website: account.website,
      alias: account.alias,
      loggedIn: response.loggedIn,
      username: response.username,
      data: account.data,
    };

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
    this.eventEmitter.emit(AccountEvent.STATUS_UPDATED, this.loginStatuses);
  }
}
