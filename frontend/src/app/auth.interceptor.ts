import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service';
import { TimerService } from './services/timer.service';
import { Router } from '@angular/router';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);
  private readonly authService = inject(AuthService);
  private readonly timerService = inject(TimerService);

  isRunning = this.authService.isRunning$;

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (
      req.url.includes('/auth/login') ||
      req.url.includes('/auth/exchange-refresh')
    ) {
      return next.handle(req);
    }

    const newReq = this.addAuthorizationHeader(req);

    return next.handle(newReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          console.log('exchange isRunning', this.isRunning);
          if (!this.isRunning) {
            return this.handle401Error(newReq, next);
          }
          return throwError(() => err);
        } else {
          return throwError(() => err);
        }
      }),
    );
  }

  private addAuthorizationHeader(req: HttpRequest<any>): HttpRequest<any> {
    const accessToken = this.storageService.getLocalStorage('token');
    if (accessToken) {
      return req.clone({
        withCredentials: true,
        headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
      });
    }
    return req;
  }

  private handle401Error(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    this.authService.isRunning = true;
    const key =
      this.storageService.getLocalStorage('email') ||
      this.storageService.getLocalStorage('nickname');

    return this.authService.exchangeRefresh(key).pipe(
      switchMap((res: any) => {
        this.storageService.setLocalStorage(key, res.accessToken);
        console.log('Токен успешно обновлен');

        const newReq = this.addAuthorizationHeader(req);
        this.authService.isRunning = false;
        return next.handle(newReq);
      }),
      catchError((err) => {
        console.log('Ошибка при обновлении токена или повторном запросе', err);
        this.authService.isRunning = false;
        if (err.status === 401) {
          this.onLogout();
        }
        return throwError(() => err);
      }),
    );
  }

  private onLogout() {
    console.log('Logging out due to failed token refresh.');
    this.authService.signOut().subscribe({
      next: () => {
        this.timerService.headerVisibility = false;
        this.storageService.clean();
        this.router.navigate(['/login']);
      },
    });
  }
}

export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: HttpRequestInterceptor, multi: true },
];
