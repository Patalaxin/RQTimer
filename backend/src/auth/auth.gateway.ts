import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface OnlineUser {
  socketId: string;
  groupName: string;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private jwtService: JwtService) {}

  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, OnlineUser>();

  getOnlineUsers() {
    console.log(this.onlineUsers);
    return this.onlineUsers;
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;
    try {
      const { email, groupName } = await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_CONSTANT,
      });

      this.onlineUsers.set(email, { socketId: client.id, groupName });

      client.on('register', () => {
        this.sendUserStatusUpdate(client, email, 'online');
        this.sendOnlineUsersList(client, groupName);
      });

      client.on('getOnlineUsersList', () => {
        this.sendOnlineUsersList(client, groupName);
      });

      client.on('ping', () => {
        client.emit('pong');
      });

      this.sendOnlineUsersList(client, groupName);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userEntry = [...this.onlineUsers.entries()].find(
      (entry) => entry[1].socketId === client.id,
    );

    if (userEntry) {
      const [email] = userEntry;
      this.onlineUsers.delete(email);

      setTimeout(() => {
        if (!this.onlineUsers.has(email)) {
          this.sendUserStatusUpdate(client, email, 'offline');
        }
      }, 10000);
    }
  }

  sendUserStatusUpdate(
    client: Socket,
    email: string,
    status: 'online' | 'offline',
  ) {
    client.emit('userStatusUpdate', { email, status });
  }

  sendOnlineUsersList(client: Socket, groupName: string) {
    const onlineUsers = Array.from(this.onlineUsers.entries())
      .filter(([, user]) => user.groupName === groupName)
      .map(([email, user]) => ({ email, ...user }));

    client.emit('onlineUsersList', onlineUsers);
  }

  getClientByEmail(email: string): Socket | undefined {
    const user = this.onlineUsers.get(email);
    if (user) {
      return this.server.sockets.sockets.get(user.socketId);
    }
    return undefined;
  }
}
