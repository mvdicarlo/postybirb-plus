import { Controller, Post, Body, Delete, Param, Get } from '@nestjs/common';
import { AccountService } from './account.service';
import { UserAccountDto } from './account.interface';
import { CreateAccountDto } from './account.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Get()
  async findAll() {
    return this.service.getAll();
  }

  @Post('/create')
  async create(@Body() createAccountDto: CreateAccountDto) {
    return this.service.createAccount(createAccountDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.removeAccount(id);
  }

  @Get('/checkLogin/:id')
  async checkLogin(@Param('id') id: string): Promise<UserAccountDto> {
    return this.service.checkLogin(id);
  }

  @Get('/loginStatuses')
  loginStatuses(): UserAccountDto[] {
    return this.service.getLoginStatuses();
  }
}
