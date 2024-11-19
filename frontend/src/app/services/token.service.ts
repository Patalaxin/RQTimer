import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { catchError, of, Subject, switchMap, throwError, take } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly authService = inject(AuthService);
  private readonly storageService = inject(StorageService);
  private readonly messageService = inject(NzMessageService);

  private refreshingToken = false;
  private refreshTokenSubject: Subject<any> = new Subject<any>();

  refreshToken() {
    if (this.refreshingToken) {
      return this.refreshTokenSubject.asObservable();
    }

    this.refreshingToken = true;
    this.refreshTokenSubject.next(null);

    const key =
      this.storageService.getLocalStorage('email') ||
      this.storageService.getLocalStorage('nickname');

    return this.authService.exchangeRefresh(key).pipe(
      switchMap((res: any) => {
        this.storageService.setLocalStorage(key, res.accessToken);
        this.refreshingToken = false;
        this.refreshTokenSubject.next(res.accessToken);
        this.refreshTokenSubject.complete();
        this.refreshTokenSubject = new Subject<any>();
        return of(res.accessToken);
      }),
      catchError((err: any) => {
        this.refreshingToken = false;
        this.refreshTokenSubject.error(err);
        this.refreshTokenSubject = new Subject<any>();
        if ((err.status >= 500 && err.status < 600) || err.status === 0) {
          this.messageService.create(
            'error',
            'Ошибка обращения к сервису. Поробуйте обновить страницу',
          );
          return throwError(() => err);
        }

        this.messageService.create('error', err.error.message);
        return throwError(() => err);
      }),
    );
  }
}
