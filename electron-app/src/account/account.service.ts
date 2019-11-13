import { Injectable, Logger } from '@nestjs/common';
import { CreateAccountDto } from './account.dto';
import { UserAccount, UserAccountDto } from './account.interface';
import { AccountRepository } from './account.repository';
import { EventsGateway } from 'src/events/events.gateway';
import { LoginResponse } from 'src/websites/interfaces/login-response.interface';
import { ModuleRef } from '@nestjs/core';
import { Website } from 'src/websites/interfaces/website.interface';

enum EVENTS {
  ACCOUNT_CREATED = 'ACCOUNT CREATED',
  ACCOUNT_DELETED = 'ACCOUNT DELETED',
  ACCOUNTS_UPDATED = 'ACCOUNTS UPDATED',
  ACCOUNTS_STATUS_UPDATED = 'ACCOUNTS STATUS UPDATED',
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  private readonly loginStatuses: UserAccountDto[] = [];

  constructor(
    private readonly repository: AccountRepository,
    private readonly eventEmitter: EventsGateway,
    private readonly moduleRef: ModuleRef,
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
  }

  async createAccount(createAccountDto: CreateAccountDto) {
    const existing: UserAccount = await this.repository.find(
      createAccountDto.id,
    );
    if (existing) {
      throw new Error(`Account with Id ${createAccountDto.id} already exists.`);
    }

    await this.repository.create(createAccountDto.toModel());
    this.eventEmitter.emit(
      EVENTS.ACCOUNTS_UPDATED,
      await this.repository.findAll(),
    );

    this.loginStatuses.push({
      id: createAccountDto.id,
      alias: createAccountDto.alias,
      website: createAccountDto.website,
      loggedIn: false,
      username: null,
    });

    this.eventEmitter.emit(EVENTS.ACCOUNT_CREATED, createAccountDto.id);
    this.eventEmitter.emit(EVENTS.ACCOUNTS_STATUS_UPDATED, this.loginStatuses);
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

    this.eventEmitter.emit(EVENTS.ACCOUNT_DELETED, id);
    this.eventEmitter.emit(EVENTS.ACCOUNTS_UPDATED, this.loginStatuses);
  }

  async checkLogin(id: string): Promise<UserAccountDto> {
    const account = await this.repository.find(id);
    if (!account) {
      throw new Error(`Account ID ${id} does not exist.`);
    }

    const website: Website = this.moduleRef.get(account.website);
    const response: LoginResponse = await website.checkLoginStatus(
      account.data,
    );

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

  private async insertOrUpdateLoginStatus(
    login: UserAccountDto,
    data: any,
  ): Promise<void> {
    const index: number = this.loginStatuses.findIndex(s => s.id === login.id);
    this.loginStatuses[index] = login;
    await this.repository.update(login.id, { data });
    this.eventEmitter.emit(EVENTS.ACCOUNTS_STATUS_UPDATED, this.loginStatuses);
  }
}
