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
  mobUpdateSubject = this.mobUpdateSubject$.asObservable();
  private isOnline$: BehaviorSubject<any> = new BehaviorSubject(null);
  isOnline = this.isOnline$.asObservable();
  private onlineUserList$: BehaviorSubject<any> = new BehaviorSubject(null);
  onlineUserList = this.onlineUserList$.asObservable();
  private pingInterval: any;
  private responseTimeout: any;

  constructor() {}

  connect(token: string, email: string): void {
    this.socket = io(environment.url, {
      path: '/api/socket.io',
      query: { token },
    });

    this.socket.on('mobUpdate', (res: any) => {
      this.mobUpdateSubject$.next(res);
    });

    this.socket.on('connect', () => {
      this.socket?.emit('register', email);
    });

    this.socket.on('pong', () => {
      console.log('Понг');
      this.resetResponseTimeout();
    });

    this.socket.on('userStatusUpdate', (res) => {
      this.isOnline$.next(res);
    });

    this.socket.on('onlineUsersList', (res) => {
      this.onlineUserList$.next(res);
    });

    this.startPingInterval();
  }

  getMobUpdates(): Observable<any> {
    return this.mobUpdateSubject;
  }

  getIsOnline(): Observable<any> {
    return this.isOnline;
  }

  getOnlineUserList(): Observable<any> {
    return this.onlineUserList;
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket) {
        console.log('Пинг');
        this.socket.emit('ping');
        this.startResponseTimeout();
      }
    }, 10000);
  }

  private startResponseTimeout(): void {
    this.responseTimeout = setTimeout(() => {
      console.log('Где понг нахуй? Съебался тварь');
      this.isOnline$.next('offline');
      this.disconnect();
    }, 3000);
  }

  private resetResponseTimeout(): void {
    if (this.responseTimeout) {
      console.log('Ответ получен, живи');
      clearTimeout(this.responseTimeout);
    }
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
