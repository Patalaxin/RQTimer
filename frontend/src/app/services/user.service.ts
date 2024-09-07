import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { environment } from 'src/environments/environment';
import { createHeaders } from '../utils/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);

  private readonly USER_API = environment.apiUrl + '/users/';

  private currentUserSubject$ = new BehaviorSubject<any[]>([]);

  get currentUser$(): Observable<any[]> {
    return this.currentUserSubject$.asObservable();
  }

  set currentUser(user: any[]) {
    this.currentUserSubject$.next(user);
  }

  getUser(): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(this.USER_API, { headers });
  }

  getAllUsers(): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${this.USER_API}list`, { headers });
  }

  getSpecificUser(key: string): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${this.USER_API}specific-user/${key}`, { headers });
  }

  createUser(user: any, excludedMobs: string[]): Observable<any> {
    let payload = {
      ...user,
      excludedMobs,
    };
    const headers = createHeaders(this.storageService);
    return this.http.post(this.USER_API, payload, { headers });
  }

  deleteUser(key: string): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.delete(`${this.USER_API}${key}`, { headers });
  }

  forgotPassword(
    email: string,
    sessionId: string,
    newPassword: string,
  ): Observable<any> {
    let payload = {
      email,
      sessionId,
      newPassword,
    };
    const headers = createHeaders(this.storageService);
    return this.http.put(`${this.USER_API}forgot-password`, payload, {
      headers,
    });
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    let payload = {
      oldPassword,
      newPassword,
    };
    const headers = createHeaders(this.storageService);
    return this.http.put(`${this.USER_API}change-password`, payload, {
      headers,
    });
  }

  updateRole(key: string, role: string): Observable<any> {
    const headers = createHeaders(this.storageService);
    let payload = this.createUserPayload(key, { role });
    return this.http.put(`${this.USER_API}role`, payload, { headers });
  }

  updateExcluded(excludedMobs: string[]): Observable<any> {
    let payload = {
      excludedMobs,
    };
    const headers = createHeaders(this.storageService);
    return this.http.put(`${this.USER_API}excluded`, payload, { headers });
  }

  updateUnavailable(key: string, unavailableMobs: string[]): Observable<any> {
    let payload = this.createUserPayload(key, { unavailableMobs });
    const headers = createHeaders(this.storageService);
    return this.http.put(`${this.USER_API}unavailable`, payload, { headers });
  }

  generateSessionId(): Observable<any> {
    let payload = {};
    const headers = createHeaders(this.storageService);
    return this.http.post(`${this.USER_API}session-id`, payload, { headers });
  }

  private createUserPayload(key: string, additionalData: object): object {
    const payload = key.includes('@') ? { email: key } : { nickname: key };
    return { ...payload, ...additionalData };
  }
}
