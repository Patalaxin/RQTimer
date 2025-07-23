import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
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
  private excludedMobsSubject$ = new BehaviorSubject<string[]>([]);

  get currentUser$(): Observable<any[]> {
    return this.currentUserSubject$.asObservable();
  }

  get excludedMobs$(): Observable<string[]> {
    return this.excludedMobsSubject$.asObservable();
  }

  get currentExcludedMobs(): string[] {
    return this.excludedMobsSubject$.value;
  }

  set currentUser(user: any[]) {
    this.currentUserSubject$.next(user);
  }

  set excludedMobs(mobs: string[]) {
    this.excludedMobsSubject$.next(mobs);
  }

  getUser(): Observable<any> {
    return this.http.get(this.USER_API);
  }

  getAllUsers(page?: number, limit?: number): Observable<any> {
    let params = new HttpParams();

    if (page) params = params.set('page', page);

    if (limit) params = params.set('limit', limit);
    return this.http.get(`${this.USER_API}list`, {
      params,
    });
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

  setUserTimezone(timezone: string): Observable<any> {
    let payload = { timezone };
    return this.http.put(`${this.USER_API}timezone`, payload);
  }

  forgotPassword(email: string, newPassword: string): Observable<any> {
    let payload = {
      email,
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
    return this.http.put(`${this.USER_API}excluded`, payload).pipe(
      tap(() => {
        this.excludedMobs = excludedMobs;
      }),
    );
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
