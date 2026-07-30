import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { INotification } from 'src/app/interfaces/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly NOTIFICATION_API = environment.apiUrl + '/notifications/';
  private notificationListSubject$ = new BehaviorSubject<INotification[]>(
    [],
  );

  get notificationList$(): Observable<INotification[]> {
    return this.notificationListSubject$.asObservable();
  }

  set notificationList(list: INotification[]) {
    this.notificationListSubject$.next(list);
  }

  createNotification(ru: string, en: string): Observable<INotification> {
    const payload = { ru, en };
    return this.http.post<INotification>(`${this.NOTIFICATION_API}`, payload);
  }

  getNotifications(): Observable<INotification[]> {
    return this.http.get<INotification[]>(`${this.NOTIFICATION_API}`);
  }
}
