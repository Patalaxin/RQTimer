import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { environment } from 'src/environments/environment';

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
    return this.http.get(this.USER_API);
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.USER_API}list`);
  }

  getSpecificUser(key: string): Observable<any> {
    return this.http.get(`${this.USER_API}specific-user/${key}`);
  }

  createUser(user: any, excludedMobs: string[]): Observable<any> {
    let payload = {
      ...user,
      excludedMobs,
    };
    return this.http.post(this.USER_API, payload);
  }

  deleteUser(key: string): Observable<any> {
    return this.http.delete(`${this.USER_API}${key}`);
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
    return this.http.put(`${this.USER_API}forgot-password`, payload);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    let payload = {
      oldPassword,
      newPassword,
    };
    return this.http.put(`${this.USER_API}change-password`, payload);
  }

  updateRole(key: string, role: string): Observable<any> {
    let payload = this.createUserPayload(key, { role });
    return this.http.put(`${this.USER_API}role`, payload);
  }

  updateExcluded(excludedMobs: string[]): Observable<any> {
    let payload = {
      excludedMobs,
    };
    return this.http.put(`${this.USER_API}excluded`, payload);
  }

  updateUnavailable(key: string, unavailableMobs: string[]): Observable<any> {
    let payload = this.createUserPayload(key, { unavailableMobs });
    return this.http.put(`${this.USER_API}unavailable`, payload);
  }

  generateSessionId(): Observable<any> {
    let payload = {};
    return this.http.post(`${this.USER_API}session-id`, payload);
  }

  private createUserPayload(key: string, additionalData: object): object {
    const payload = key.includes('@') ? { email: key } : { nickname: key };
    return { ...payload, ...additionalData };
  }
}
