import { Controller, Post, Body, Delete, Param, Get, Patch } from '@nestjs/common';
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

  @Post('create')
  async create(@Body() createAccountDto: CreateAccountDto) {
    return this.service.createAccount(createAccountDto);
  }

  @Patch('data/:id')
  async setData(@Body() body: { data: any }, @Param('id') id: string) {
    return this.service.setData(id, body.data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.removeAccount(id);
  }

  @Get('check/:id')
  async checkLogin(@Param('id') id: string): Promise<UserAccountDto> {
    return this.service.checkLogin(id);
  }

  @Get('statuses')
  loginStatuses(): UserAccountDto[] {
    return this.service.getLoginStatuses();
  }
}
