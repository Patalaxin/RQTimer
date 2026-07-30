import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IFullMob } from 'src/app/interfaces/timer-item';
import { IUserOnlineStatus, IOnlineUser } from 'src/app/interfaces/websocket';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: Socket | undefined;
  private mobUpdateSubject$ = new BehaviorSubject<IFullMob | null>(null);
  private isOnlineSubject$ = new BehaviorSubject<IUserOnlineStatus | null>(
    null,
  );
  private onlineUserListSubject$ = new BehaviorSubject<
    IOnlineUser[] | null
  >(null);
  private pingInterval: ReturnType<typeof setInterval> | undefined;
  private responseTimeout: ReturnType<typeof setTimeout> | undefined;
  private currentEmail: string | undefined;

  get mobUpdate$(): Observable<IFullMob | null> {
    return this.mobUpdateSubject$.asObservable();
  }

  get isOnline$(): Observable<IUserOnlineStatus | null> {
    return this.isOnlineSubject$.asObservable();
  }

  get onlineUserList$(): Observable<IOnlineUser[] | null> {
    return this.onlineUserListSubject$.asObservable();
  }

  connect(token: string, email: string): void {
    this.currentEmail = email;

    this.socket = io(environment.url, {
      path: environment.socketPath,
      query: { token },
      transports: ['websocket'],
    });

    this.socket.on('mobUpdate', (res: IFullMob) =>
      this.mobUpdateSubject$.next(res),
    );
    this.socket.on('connect', () => {
      this.socket?.emit('register', email);
      this.resetResponseTimeout();
      this.isOnlineSubject$.next({ email, status: 'online' });
    });
    this.socket.on('pong', () => {
      this.resetResponseTimeout();
      this.isOnlineSubject$.next({ email, status: 'online' });
    });
    this.socket.on('userStatusUpdate', (res: IUserOnlineStatus) =>
      this.isOnlineSubject$.next(res),
    );
    this.socket.on('onlineUsersList', (res: IOnlineUser[]) =>
      this.onlineUserListSubject$.next(res),
    );

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
