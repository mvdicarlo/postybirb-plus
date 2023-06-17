import { Body, Controller, Get, Query} from '@nestjs/common';
import { MissKeyAccountData } from 'postybirb-commons';
import { GenericWebsiteController } from '../generic/generic.controller';
import { MissKey } from './misskey.service';
import { getCurrentWindow } from '@electron/remote';

@Controller('misskey')
export class MissKeyController {

  @Get('display')
  async display(@Query('token') token : string, @Query('code') code : string) {
    return `<html>
    <p>Token: ${token} <br/>
    Code: ${code} </p>
    </html>`
    
    // Find the form that is open
    // Pop in the code
    // Save


  }

}
