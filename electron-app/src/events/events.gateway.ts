import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

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
