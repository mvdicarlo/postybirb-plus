import { Injectable, Logger } from '@nestjs/common';
import { CreateAccountDto } from './account.dto';
import { Account } from './account.interface';
import { AccountRepository } from './account.repository';
import { EventsGateway } from 'src/events/events.gateway';

enum EVENTS {
  ACCOUNT_CREATED = 'ACCOUNT CREATED',
  ACCOUNT_DELETED = 'ACCOUNT DELETED',
  ACCOUNTS_UPDATED = 'ACCOUNTS UPDATED',
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly repository: AccountRepository,
    private readonly eventEmitter: EventsGateway,
  ) {}

  async createAccount(createAccountDto: CreateAccountDto) {
    const existing: Account = await this.repository.find(createAccountDto.id);
    if (existing) {
      throw new Error(`Account with Id ${createAccountDto.id} already exists.`);
    }

    await this.repository.create(createAccountDto.toModel());
    this.eventEmitter.emit(
      EVENTS.ACCOUNTS_UPDATED,
      await this.repository.findAll(),
    );
  }

  getAll(): Promise<Account[]> {
    return this.repository.findAll();
  }

  async removeAccount(id: string): Promise<void> {
    await this.repository.remove(id);
    this.eventEmitter.emit(
      EVENTS.ACCOUNTS_UPDATED,
      await this.repository.findAll(),
    );
  }
}
