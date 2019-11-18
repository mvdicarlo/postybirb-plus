import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Submission } from 'src/submission/submission.interface';

@WebSocketGateway()
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  public emit(event: string, data: any) {
    this.server.emit(event, data);
  }

  public async emitOnComplete(event: string, promise: Promise<any>) {
    this.server.emit(event, await promise);
  }
}
