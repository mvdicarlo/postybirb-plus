import { Module } from '@nestjs/common';
import { UpdateController } from './update.controller';
import { UpdateService } from './update.service';
import { PostModule } from 'src/server/submission/post/post.module';

@Module({
  imports: [PostModule],
  controllers: [UpdateController],
  providers: [UpdateService],
})
export class UpdateModule {}
