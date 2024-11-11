import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthGateway } from '../auth/auth.gateway';

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

  constructor(private authGateway: AuthGateway) {}

  sendMobUpdate(data: any) {
    const onlineUsers = this.authGateway.getOnlineUsers();
    console.log(onlineUsers);

    onlineUsers.forEach((user) => {
      console.log(user.groupName);
      console.log(data.groupName);

      if (user.groupName === data.groupName) {
        const socket = this.server.sockets.sockets.get(user.socketId);
        if (socket) {
          socket.emit('mobUpdate', data);
        }
      }
    });
  }
}
