import { Controller, Post, Body } from '@nestjs/common';
import { RemoteService } from './remote.service';

@Controller('remote')
export class RemoteController {
  constructor(private readonly service: RemoteService) {}

  @Post('updateCookies')
  async updateCookies(@Body() body: { accountId: string; cookies: Electron.Cookie[] }) {
    return this.service.updateCookies(body.accountId, body.cookies);
  }
}
