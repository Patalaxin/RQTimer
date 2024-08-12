import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageService } from './services/storage.service';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(private storageService: StorageService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const newReq = req.clone({
      withCredentials: true,
      headers: this.addAuthorizationHeader(req.headers),
    });

    return next.handle(newReq);
  }

  private addAuthorizationHeader(headers: HttpHeaders): HttpHeaders {
    const accessToken = this.storageService.getLocalStorage('token');
    return accessToken
      ? headers.set('Authorization', `Bearer ${accessToken}`)
      : headers;
  }
}

export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: HttpRequestInterceptor, multi: true },
];
