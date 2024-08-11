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
    this.socket = io(environment.url, {
      path: '/api/socket.io',
      query: { token },
    });

    this.socket.on('mobUpdate', (res) => this.mobUpdateSubject$.next(res));
    this.socket.on('connect', () => this.socket?.emit('register', email));
    this.socket.on('pong', () => this.resetResponseTimeout());
    this.socket.on('userStatusUpdate', (res) =>
      this.isOnlineSubject$.next(res)
    );
    this.socket.on('onlineUsersList', (res) =>
      this.onlineUserListSubject$.next(res)
    );

    this.startPingInterval();
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket) {
        this.socket.emit('ping');
        this.startResponseTimeout();
      }
    }, 10000);
  }

  private startResponseTimeout(): void {
    this.responseTimeout = setTimeout(() => {
      this.isOnlineSubject$.next('offline');
      this.disconnect();
    }, 3000);
  }

  private resetResponseTimeout(): void {
    if (this.responseTimeout) clearTimeout(this.responseTimeout);
  }

  disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
  }
}
