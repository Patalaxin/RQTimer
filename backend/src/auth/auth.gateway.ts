import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  },
})
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private jwtService: JwtService) {}

  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>(); // email -> socketId

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;
    try {
      await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_CONSTANT,
      });

      console.log(`Client connected: ${client.id}`);
      client.on('register', (email: string) => {
        this.onlineUsers.set(email, client.id);
        this.sendUserStatusUpdate(email, 'online');
      });

      client.on('ping', () => {
        client.emit('pong');
      });
    } catch (error) {
      console.error('Token verification failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const email = [...this.onlineUsers.entries()].find(
      (entry) => entry[1] === client.id,
    )?.[0];
    if (email) {
      setTimeout(() => {
        if (!this.onlineUsers.has(email)) {
          this.sendUserStatusUpdate(email, 'offline');
        }
      }, 10000);
    }
  }

  sendUserStatusUpdate(email: string, status: 'online' | 'offline') {
    this.server.emit('userStatusUpdate', { email, status });
  }
}
