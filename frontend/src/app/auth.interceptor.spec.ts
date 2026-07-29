import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from 'src/environments/environment';
import { httpInterceptorProviders } from './auth.interceptor';
import { StorageService } from './services/storage.service';
import { TimerService } from './services/timer.service';

const API = environment.apiUrl;
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };

/**
 * Регрессия на бесконечный цикл запросов: протухший access-токен в localStorage
 * плюс отсутствующая refresh-кука уводили фронт в рекурсию
 * «401 → exchange-refresh → onLogout → signOut → 401 → ...», потому что signOut
 * шёл через тот же интерцептор с тем же протухшим токеном, а localStorage
 * чистился только в ветке успеха, до которой дело не доходило.
 */
describe('HttpRequestInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: { navigate: jasmine.Spy };
  let messageService: { create: jasmine.Spy };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'stale-access-token');
    localStorage.setItem('email', 'user@example.com');

    router = { navigate: jasmine.createSpy('navigate') };
    messageService = { create: jasmine.createSpy('create') };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        httpInterceptorProviders,
        StorageService,
        { provide: Router, useValue: router },
        { provide: NzMessageService, useValue: messageService },
        { provide: TimerService, useValue: { headerVisibility: true } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
  });

  const failRefresh = () => {
    httpMock
      .expectOne(`${API}/auth/exchange-refresh`)
      .flush(
        { message: 'Refresh token is missing from the request' },
        UNAUTHORIZED,
      );
  };

  it('stops after a single signOut when the refresh token is gone', () => {
    http.get(`${API}/mobs`).subscribe({ error: () => undefined });

    httpMock.expectOne(`${API}/mobs`).flush({}, UNAUTHORIZED);
    failRefresh();

    // signOut уходит с тем же протухшим токеном и тоже получает 401 — на нём
    // цикл и замыкался.
    httpMock.expectOne(`${API}/auth/signout`).flush({}, UNAUTHORIZED);

    // Ни одного запроса сверх этих трёх: verify() падает на любом лишнем.
    expect(() => httpMock.verify()).not.toThrow();
  });

  it('clears the stale session even though signOut fails', () => {
    http.get(`${API}/mobs`).subscribe({ error: () => undefined });

    httpMock.expectOne(`${API}/mobs`).flush({}, UNAUTHORIZED);
    failRefresh();
    httpMock.expectOne(`${API}/auth/signout`).flush({}, UNAUTHORIZED);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('email')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('logs out once for a burst of parallel 401s', () => {
    http.get(`${API}/mobs`).subscribe({ error: () => undefined });
    http.get(`${API}/groups`).subscribe({ error: () => undefined });

    httpMock.expectOne(`${API}/mobs`).flush({}, UNAUTHORIZED);
    httpMock.expectOne(`${API}/groups`).flush({}, UNAUTHORIZED);

    // TokenService схлопывает параллельные обновления в один запрос...
    failRefresh();
    // ...а флаг в интерцепторе — в один разлогин и один тост.
    expect(httpMock.match(`${API}/auth/signout`).length).toBe(1);
    expect(messageService.create).toHaveBeenCalledTimes(1);
  });

  it('keeps the Authorization header on a normal signOut', () => {
    http.get(`${API}/auth/signout`).subscribe({ error: () => undefined });

    const signOut = httpMock.expectOne(`${API}/auth/signout`);
    expect(signOut.request.headers.get('Authorization')).toBe(
      'Bearer stale-access-token',
    );

    // 401 на signOut больше не запускает обновление токена.
    signOut.flush({}, UNAUTHORIZED);
    expect(() => httpMock.verify()).not.toThrow();
  });
});
