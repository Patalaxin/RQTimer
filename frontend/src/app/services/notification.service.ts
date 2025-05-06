import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly NOTIFICATION_API = environment.apiUrl + '/notifications/';
  private notificationListSubject$ = new BehaviorSubject<any[]>([]);

  get notificationList$(): Observable<any[]> {
    return this.notificationListSubject$.asObservable();
  }

  set notificationList(list: any[]) {
    this.notificationListSubject$.next(list);
  }

  getNotifications(): Observable<any> {
    return this.http.get(`${this.NOTIFICATION_API}`);
  }
}
