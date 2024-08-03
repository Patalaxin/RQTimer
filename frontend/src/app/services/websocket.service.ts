import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: Socket | undefined;

  constructor() {}

  connect(token: string): void {
    this.socket = io(environment.apiUrl, {
      query: { token },
    });
  }

  onMobUpdate(): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket) {
        console.error('Socket is not connected. Call connect() first.');
        return;
      }
      this.socket.on('mobUpdate', (res: any) => {
        observer.next(res);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
  }
}
