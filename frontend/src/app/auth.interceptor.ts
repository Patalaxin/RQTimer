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
import { TokenService } from './services/token.service';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);
  private readonly authService = inject(AuthService);
  private readonly timerService = inject(TimerService);
  private readonly tokenService = inject(TokenService);

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
          return this.handle401Error(newReq, next);
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
    return this.tokenService.refreshToken().pipe(
      switchMap(() => {
        const newReq = this.addAuthorizationHeader(req);
        return next.handle(newReq);
      }),
      catchError((err) => {
        console.log('Ошибка при обновлении токена или повторном запросе', err);
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
