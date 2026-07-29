import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthGateway } from '../auth/auth.gateway';

// Единственное место, где остаётся прямой process.env: аргумент декоратора
// вычисляется при загрузке модуля, когда контейнера Nest, а значит и
// ConfigService, ещё нет. Ради этого main.ts и вызывает dotenv.config() до
// импорта AppModule — см. комментарий там же.
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN,
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
    onlineUsers.forEach((user) => {
      if (user.groupName === data.groupName) {
        const socket = this.server.sockets.sockets.get(user.socketId);
        if (socket) {
          socket.emit('mobUpdate', data);
        }
      }
    });
  }
}
