import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { catchError, of, Subject, switchMap, throwError } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly authService = inject(AuthService);
  private readonly storageService = inject(StorageService);
  private readonly messageService = inject(NzMessageService);

  private refreshingToken = false;
  private refreshTokenSubject: Subject<string> = new Subject<string>();

  refreshToken() {
    if (this.refreshingToken) {
      return this.refreshTokenSubject.asObservable();
    }

    this.refreshingToken = true;

    const key =
      this.storageService.getLocalStorage('email') ||
      this.storageService.getLocalStorage('nickname');

    return this.authService.exchangeRefresh(key).pipe(
      switchMap((res) => {
        this.storageService.setLocalStorage(key, res.accessToken);
        this.refreshingToken = false;
        this.refreshTokenSubject.next(res.accessToken);
        this.refreshTokenSubject.complete();
        this.refreshTokenSubject = new Subject<string>();
        return of(res.accessToken);
      }),
      catchError((err: HttpErrorResponse) => {
        this.refreshingToken = false;
        this.refreshTokenSubject.error(err);
        this.refreshTokenSubject = new Subject<string>();
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
