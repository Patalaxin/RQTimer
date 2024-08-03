import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  },
})
export class MobGateway {
  @WebSocketServer()
  server: Server;

  sendMobUpdate(data: any) {
    this.server.emit('mobUpdate', data);
  }
}
