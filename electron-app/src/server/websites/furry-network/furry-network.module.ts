import { Module } from '@nestjs/common';
import { FurryNetwork } from './furry-network.service';
import { FurryNetworkController } from './furry-network.controller';

@Module({
  providers: [FurryNetwork],
  controllers: [FurryNetworkController],
  exports: [FurryNetwork],
})
export class FurryNetworkModule {}
