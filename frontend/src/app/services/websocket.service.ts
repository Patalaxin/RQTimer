import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: Socket | undefined;
  private mobUpdateSubject$: BehaviorSubject<any> = new BehaviorSubject(null);
  private isOnlineSubject$: BehaviorSubject<any> = new BehaviorSubject(null);
  private onlineUserListSubject$: BehaviorSubject<any> = new BehaviorSubject(
    null
  );
  private pingInterval: any;
  private responseTimeout: any;
  private currentEmail: string | undefined;

  get mobUpdate$(): Observable<any> {
    return this.mobUpdateSubject$.asObservable();
  }

  get isOnline$(): Observable<any> {
    return this.isOnlineSubject$.asObservable();
  }

  get onlineUserList$(): Observable<any> {
    return this.onlineUserListSubject$.asObservable();
  }

  connect(token: string, email: string): void {
    this.currentEmail = email;

    this.socket = io(environment.url, {
      path: environment.socketPath,
      query: { token },
      transports: ['websocket'],
    });

    this.socket.on('mobUpdate', (res) => this.mobUpdateSubject$.next(res));
    this.socket.on('connect', () => {
      this.socket?.emit('register', email);
      this.resetResponseTimeout();
      this.isOnlineSubject$.next({ email, status: 'online' });
    });
    this.socket.on('pong', () => {
      this.resetResponseTimeout();
      this.isOnlineSubject$.next({ email, status: 'online' });
    });
    this.socket.on('userStatusUpdate', (res) =>
      this.isOnlineSubject$.next(res)
    );
    this.socket.on('onlineUsersList', (res) => this.onlineUserListSubject$.next(res));

    this.startPingInterval();
  }

  emitGetOnlineUserList(): void {
    this.socket?.emit('getOnlineUsersList');
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (!this.socket) return;

      if (this.socket.connected) {
        this.socket.emit('ping');
        this.startResponseTimeout();
      } else {
        this.socket.connect();
      }
    }, 10000);
  }

  private startResponseTimeout(): void {
    this.responseTimeout = setTimeout(() => {
      if (this.currentEmail) {
        this.isOnlineSubject$.next({ email: this.currentEmail, status: 'offline' });
      }
      this.reconnectSocket();
    }, 3000);
  }

  private reconnectSocket(): void {
    if (!this.socket) return;
    // Форсим переоткрытие транспорта: соединение может быть "наполовину живым"
    // (прокси держит TCP, а трафик уже не проходит) — .connect() без явного
    // .disconnect() в этом случае будет no-op, т.к. socket.connected ещё true.
    this.socket.disconnect();
    this.socket.connect();
  }

  private resetResponseTimeout(): void {
    if (this.responseTimeout) clearTimeout(this.responseTimeout);
  }

  disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.responseTimeout) {
      clearTimeout(this.responseTimeout);
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
    this.currentEmail = undefined;
  }
}
