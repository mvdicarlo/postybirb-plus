import { Body, Controller, Get, Query } from '@nestjs/common';

@Controller('misskey')
export class MissKeyController {
  @Get('display/:auth')
  async display(@Query('token') token: string, @Query('code') code: string) {
    if (token === undefined) {
      token = '';
    }
    if (code === undefined) {
      code = '';
    }

    return `<html>
    <p>Token: ${token} <br/>
    Code: ${code} </p>
    </html>`;
  }
}
