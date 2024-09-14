import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class MobGateway {
  @WebSocketServer()
  server: Server;

  sendMobUpdate(data: any) {
    this.server.sockets.sockets.forEach((socket) => {
      const user = this.server.sockets.sockets.get(socket.id);
      if (user && user.handshake.query.groupName === data.groupName) {
        socket.emit('mobUpdate', data);
      }
    });
  }
}
