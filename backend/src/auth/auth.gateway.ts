import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>(); // email -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.on('register', (email: string) => {
      this.onlineUsers.set(email, client.id);
      this.sendUserStatusUpdate(email, 'online');
    });

    client.on('ping', () => {
      client.emit('pong');
    });
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
