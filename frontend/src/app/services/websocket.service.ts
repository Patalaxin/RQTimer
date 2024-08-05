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

  constructor() {}

  connect(token: string): void {
    this.socket = io(environment.apiUrl, {
      query: { token },
    });

    this.socket.on('mobUpdate', (res: any) => {
      this.mobUpdateSubject$.next(res);
    });
  }

  getMobUpdates(): Observable<any> {
    return this.mobUpdateSubject;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
  }
}
