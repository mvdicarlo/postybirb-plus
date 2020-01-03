import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AppGlobal } from 'src/app-global.interface';

@WebSocketGateway()
export class EventsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    server.use((socket, next) => {
      if (socket.handshake.headers.authorization === (global as AppGlobal).AUTH_ID) {
        return next();
      }

      return next(new Error('Authentication Error'));
    });
  }

  public emit(event: string, data: any) {
    this.server.emit(event, data);
  }

  public async emitOnComplete(event: string, promise: Promise<any>) {
    this.server.emit(event, await promise);
  }
}
