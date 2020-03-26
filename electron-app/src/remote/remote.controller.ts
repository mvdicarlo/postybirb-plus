import { Controller, Post, Body, Get, Res, Query } from '@nestjs/common';
import { RemoteService } from './remote.service';
import { Response } from 'express';

@Controller('remote')
export class RemoteController {
  constructor(private readonly service: RemoteService) {}

  @Post('updateCookies')
  async updateCookies(@Body() body: { accountId: string; cookies: Electron.Cookie[] }) {
    return this.service.updateCookies(body.accountId, body.cookies);
  }

  @Get('static')
  serveStaticFile(@Query() query: { uri: string }, @Res() res: Response) {
    if (!query.uri || !query.uri.startsWith(global.BASE_DIRECTORY)) {
      res.sendStatus(404);
      return;
    }
    res.sendFile(query.uri);
  }
}
