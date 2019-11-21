import { Injectable, Logger } from '@nestjs/common';
import { CreateAccountDto } from './account.dto';
import { UserAccount, UserAccountDto } from './account.interface';
import { AccountRepository } from './account.repository';
import { EventsGateway } from 'src/events/events.gateway';
import { LoginResponse } from 'src/websites/interfaces/login-response.interface';
import { WebsiteProvider } from 'src/websites/website-provider.service';
import { session } from 'electron';
import { SubmissionPartService } from 'src/submission/submission-part/submission-part.service';
import { FileSubmissionService } from 'src/submission/file-submission/file-submission.service';
import { AccountEvent } from './account.events.enum';

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
    private readonly fileSubmissionService: FileSubmissionService,
  ) {
    this.repository
      .findAll()
      .then(results => {
        results.forEach(result => {
          this.loginStatuses.push({
            id: result.id,
            alias: result.alias,
            website: result.website,
            loggedIn: false,
            username: null,
          });
        });
      })
      .finally(() => {
        this.loginStatuses.forEach(s => this.checkLogin(s.id));
      });

    this.websiteProvider.getAllWebsiteModules().forEach(website => {
      const { refreshInterval } = website;
      if (!this.loginCheckTimers[refreshInterval]) {
        this.loginCheckTimers[refreshInterval] = setInterval(async () => {
          const accountsToRefresh = await this.repository.findAll({
            website: { $in: this.loginCheckMap[refreshInterval] },
          });
          accountsToRefresh.forEach(account => this.checkLogin(account));
        }, refreshInterval);
      }

      this.loginCheckMap[refreshInterval] = this.loginCheckMap[refreshInterval] || [];
      this.loginCheckMap[refreshInterval].push(website.constructor.name);
    });
  }

  async createAccount(createAccountDto: CreateAccountDto) {
    const existing: UserAccount = await this.repository.find(createAccountDto.id);
    if (existing) {
      throw new Error(`Account with Id ${createAccountDto.id} already exists.`);
    }

    await this.repository.create(createAccountDto);

    this.loginStatuses.push({
      id: createAccountDto.id,
      alias: createAccountDto.alias,
      website: createAccountDto.website,
      loggedIn: false,
      username: null,
    });

    this.eventEmitter.emit(AccountEvent.CREATED, createAccountDto.id);
    this.eventEmitter.emit(AccountEvent.STATUS_UPDATED, this.loginStatuses);
    this.eventEmitter.emitOnComplete(AccountEvent.UPDATED, this.repository.findAll());
  }

  getAll(): Promise<UserAccount[]> {
    return this.repository.findAll();
  }

  getLoginStatuses(): UserAccountDto[] {
    return [...this.loginStatuses];
  }

  async removeAccount(id: string): Promise<void> {
    await this.repository.remove(id);
    const index: number = this.loginStatuses.findIndex(s => s.id === id);
    if (index !== -1) {
      this.loginStatuses.splice(index, 1);
    }

    this.eventEmitter.emit(AccountEvent.DELETED, id);
    this.eventEmitter.emit(AccountEvent.STATUS_UPDATED, this.loginStatuses);
    this.eventEmitter.emit(AccountEvent.UPDATED, await this.repository.findAll());

    session
      .fromPartition(`persist:${id}`)
      .clearStorageData()
      .then(() => this.logger.debug(`Session data for ${id} cleared`, 'Account'));

    await this.submissionPartService.removeAllSubmissionPartsForAccount(id);
    this.fileSubmissionService.verifyAllSubmissions();
  }

  async checkLogin(userAccount: string | UserAccount): Promise<UserAccountDto> {
    const account: UserAccount =
      typeof userAccount === 'string' ? await this.repository.find(userAccount) : userAccount;
    if (!account) {
      throw new Error(`Account ID ${userAccount} does not exist.`);
    }

    this.logger.debug(`Checking login for ${account.id}`, 'Login Check');
    const website = this.websiteProvider.getWebsiteModule(account.website);
    const response: LoginResponse = await website.checkLoginStatus(account);

    const login: UserAccountDto = {
      id: account.id,
      website: account.website,
      alias: account.alias,
      loggedIn: response.loggedIn,
      username: response.username,
    };

    this.insertOrUpdateLoginStatus(login, response.data);
    return login;
  }

  private async insertOrUpdateLoginStatus(login: UserAccountDto, data: any): Promise<void> {
    const index: number = this.loginStatuses.findIndex(s => s.id === login.id);
    this.loginStatuses[index] = login;
    await this.repository.update(login.id, { data });
    this.eventEmitter.emit(AccountEvent.STATUS_UPDATED, this.loginStatuses);
  }
}
