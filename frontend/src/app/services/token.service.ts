import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { catchError, of, Subject, switchMap, throwError, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly authService = inject(AuthService);
  private readonly storageService = inject(StorageService);

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
      catchError((err) => {
        this.refreshingToken = false;
        this.refreshTokenSubject.error(err);
        this.refreshTokenSubject = new Subject<any>();
        return throwError(() => err);
      }),
    );
  }
}
