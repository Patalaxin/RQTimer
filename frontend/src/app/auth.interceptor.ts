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
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service';
import { TimerService } from './services/timer.service';
import { Router } from '@angular/router';
import { TokenService } from './services/token.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IApiError } from './interfaces/api-error';
// import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);
  private readonly authService = inject(AuthService);
  private readonly timerService = inject(TimerService);
  private readonly tokenService = inject(TokenService);
  // private readonly translateService = inject(TranslateService);
  private readonly messageService = inject(NzMessageService);

  private loggingOut = false;

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (
      req.url.includes('/auth/login') ||
      req.url.includes('/auth/exchange-refresh') ||
      (req.url.includes('/notifications') && req.method === 'GET')
    ) {
      return next.handle(req);
    }

    const newReq = this.addAuthorizationHeader(req);

    return next.handle(newReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          // signOut уходит с тем же протухшим токеном, который и вызвал 401.
          // Обновлять его здесь нечем и незачем, а рекурсия «401 → refresh →
          // onLogout → signOut → 401 → ...» вполне реальна — ровно ею фронт и
          // уходил в бесконечный цикл запросов. Ошибку глотает onLogout.
          if (req.url.includes('/auth/signout')) {
            return throwError(() => err);
          }

          return this.handle401Error(newReq, next);
        }

        if ((err.status >= 500 && err.status < 600) || err.status === 0) {
          this.messageService.create(
            'error',
            // this.translateService.instant('INTERCEPTOR.MESSAGE.SERVICE_ERROR)',
            'Ошибка обращения к сервису. Попробуйте обновить страницу',
          );
          return throwError(() => err);
        }

        this.messageService.create('error', this.textOf(err));
        return throwError(() => err);
      }),
    );
  }

  /**
   * ValidationPipe отдаёт `message` массивом нарушенных правил — в тост он
   * попадал как `a,b,c`. Показываем по строке.
   */
  private textOf(err: HttpErrorResponse): string {
    const body = err.error as IApiError | null;
    const message = body?.message;

    if (Array.isArray(message)) {
      return message.join('\n');
    }

    return message ?? 'Что-то пошло не так';
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
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.onLogout();
        }

        return throwError(() => err);
      }),
    );
  }

  private onLogout() {
    // Страница поднимает запросы пачкой, и 401 прилетает на каждый. Без этих
    // двух проверок разлогин уходил бы столько раз, сколько было запросов.
    if (this.loggingOut || !this.storageService.isLoggedIn()) {
      return;
    }
    this.loggingOut = true;

    // Локальную сессию чистим независимо от ответа сервера: signOut уходит с
    // тем же протухшим токеном и сам отвечает 401, а оставленный в localStorage
    // токен — это ровно то состояние, из которого всё и началось.
    this.authService
      .signOut()
      .pipe(
        finalize(() => {
          this.timerService.headerVisibility = false;
          this.storageService.clean();
          this.loggingOut = false;
          this.router.navigate(['/login']);
        }),
      )
      .subscribe({ error: () => undefined });
  }
}

export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: HttpRequestInterceptor, multi: true },
];
