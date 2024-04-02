import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SubmissionPost } from './models/submission-post.model';
import { TwitterAuthorization } from './models/twitter-authorization.model';
import { TwitterAPIService } from './twitter-api.service';

@Controller('twitter')
export class TwitterController {
  constructor(private readonly service: TwitterAPIService) {}

  @Get('v2/authorize')
  startAuthorization(@Query() data: { key: string; secret: string }) {
    return this.service.startAuthorization(data);
  }

  @Post('v2/authorize')
  completeAuthorization(@Body() data: TwitterAuthorization) {
    return this.service.completeAuthorization(data);
  }

  @Post('v2/post')
  post(@Query() apiKeys: { key: string; secret: string }, @Body() data: SubmissionPost<null>) {
    return this.service.post(apiKeys, data);
  }
}
