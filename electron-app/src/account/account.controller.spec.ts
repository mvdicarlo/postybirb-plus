import { Test } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountRepository } from './account.repository';
import UserAccountEntity from './models/user-account.entity';

describe('AccountController', () => {
  let accountRepository: AccountRepository;
  let accountService: AccountService;
  let accountController: AccountController;

  it('should create account', async () => {
    expect('x').toBeDefined();
  });
});
