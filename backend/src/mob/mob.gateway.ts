import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: '*:*' })
export class MobGateway {
  @WebSocketServer()
  server: Server;

  sendMobUpdate(data: any) {
    this.server.emit('mobUpdate', data);
  }
}
