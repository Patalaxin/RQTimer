import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { environment } from 'src/environments/environment';
import { createHeaders } from '../utils/http';

const USER_API = environment.apiUrl + '/user/';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private currentUserSubject$ = new BehaviorSubject<any[]>([]);

  get currentUser$(): Observable<any[]> {
    return this.currentUserSubject$.asObservable();
  }

  set currentUser(user: any[]) {
    this.currentUserSubject$.next(user);
  }

  getUser(): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(USER_API, { headers });
  }

  getAllUsers(): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${USER_API}findAll`, { headers });
  }

  getSpecificUser(key: string): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${USER_API}specificUser/${key}`, { headers });
  }

  createUser(user: any, excludedMobs: string[]): Observable<any> {
    let payload = {
      ...user,
      excludedMobs,
    };
    const headers = createHeaders(this.storageService);
    return this.http.post(USER_API, payload, { headers });
  }

  deleteUser(key: string): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.delete(`${USER_API}${key}`, { headers });
  }

  forgotPassword(
    email: string,
    sessionId: string,
    newPassword: string
  ): Observable<any> {
    let payload = {
      email,
      sessionId,
      newPassword,
    };
    const headers = createHeaders(this.storageService);
    return this.http.put(`${USER_API}forgotPassword`, payload, { headers });
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    let payload = {
      oldPassword,
      newPassword,
    };
    const headers = createHeaders(this.storageService);
    return this.http.put(`${USER_API}changePassword`, payload, { headers });
  }

  updateRole(key: string, role: string): Observable<any> {
    const headers = createHeaders(this.storageService);
    let payload = this.createUserPayload(key, { role });
    return this.http.put(`${USER_API}updateRole`, payload, { headers });
  }

  updateExcluded(excludedMobs: string[]): Observable<any> {
    let payload = {
      excludedMobs,
    };
    const headers = createHeaders(this.storageService);
    return this.http.put(`${USER_API}updateExcluded`, payload, { headers });
  }

  updateUnavailable(key: string, unavailableMobs: string[]): Observable<any> {
    let payload = this.createUserPayload(key, { unavailableMobs });
    const headers = createHeaders(this.storageService);
    return this.http.put(`${USER_API}updateUnavailable`, payload, { headers });
  }

  generateSessionId(): Observable<any> {
    let payload = {};
    const headers = createHeaders(this.storageService);
    return this.http.post(`${USER_API}generateSessionId`, payload, { headers });
  }

  private createUserPayload(key: string, additionalData: object): object {
    const payload = key.includes('@') ? { email: key } : { nickname: key };
    return { ...payload, ...additionalData };
  }
}
