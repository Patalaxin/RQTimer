import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { environment } from 'src/environments/environment';
import { IUser } from 'src/app/interfaces/user';

export interface IPaginatedUsers {
  data: IUser[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);

  private readonly USER_API = environment.apiUrl + '/users/';

  private currentUserSubject$ = new BehaviorSubject<IUser | null>(
    null,
  );
  private excludedMobsSubject$ = new BehaviorSubject<string[]>([]);

  get currentUser$(): Observable<IUser | null> {
    return this.currentUserSubject$.asObservable();
  }

  get excludedMobs$(): Observable<string[]> {
    return this.excludedMobsSubject$.asObservable();
  }

  get currentExcludedMobs(): string[] {
    return this.excludedMobsSubject$.value;
  }

  set currentUser(user: IUser | null) {
    this.currentUserSubject$.next(user);
  }

  set excludedMobs(mobs: string[]) {
    this.excludedMobsSubject$.next(mobs);
  }

  getUsersCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.USER_API}stats/count`);
  }

  getUser(): Observable<IUser> {
    return this.http.get<IUser>(this.USER_API);
  }

  getAllUsers(page?: number, limit?: number): Observable<IPaginatedUsers> {
    let params = new HttpParams();

    if (page) params = params.set('page', page);

    if (limit) params = params.set('limit', limit);
    return this.http.get<IPaginatedUsers>(`${this.USER_API}list`, {
      params,
    });
  }

  getSpecificUser(key: string): Observable<IUser> {
    return this.http.get<IUser>(
      `${this.USER_API}specific-user/${key}`,
    );
  }

  createUser(
    user: { email: string; nickname: string; password: string },
    excludedMobs: string[],
  ): Observable<IUser> {
    let payload = {
      ...user,
      excludedMobs,
    };
    return this.http.post<IUser>(this.USER_API, payload);
  }

  deleteUser(key: string): Observable<void> {
    return this.http.delete<void>(`${this.USER_API}${key}`);
  }

  setUserTimezone(timezone: string): Observable<IUser> {
    let payload = { timezone };
    return this.http.put<IUser>(`${this.USER_API}timezone`, payload);
  }

  forgotPassword(
    email: string,
    newPassword: string,
  ): Observable<{ message: string }> {
    let payload = {
      email,
      newPassword,
    };
    return this.http.put<{ message: string }>(
      `${this.USER_API}forgot-password`,
      payload,
    );
  }

  changePassword(
    oldPassword: string,
    newPassword: string,
  ): Observable<{ message: string }> {
    let payload = {
      oldPassword,
      newPassword,
    };
    return this.http.put<{ message: string }>(
      `${this.USER_API}change-password`,
      payload,
    );
  }

  updateRole(key: string, role: string): Observable<IUser> {
    let payload = this.createUserPayload(key, { role });
    return this.http.put<IUser>(`${this.USER_API}role`, payload);
  }

  updateExcluded(excludedMobs: string[]): Observable<IUser> {
    let payload = {
      excludedMobs,
    };
    return this.http
      .put<IUser>(`${this.USER_API}excluded`, payload)
      .pipe(
        tap(() => {
          this.excludedMobs = excludedMobs;
        }),
      );
  }

  updateUnavailable(
    key: string,
    unavailableMobs: string[],
  ): Observable<IUser> {
    let payload = this.createUserPayload(key, { unavailableMobs });
    return this.http.put<IUser>(
      `${this.USER_API}unavailable`,
      payload,
    );
  }

  generateSessionId(): Observable<{ sessionId: string }> {
    let payload = {};
    return this.http.post<{ sessionId: string }>(
      `${this.USER_API}session-id`,
      payload,
    );
  }

  private createUserPayload(key: string, additionalData: object): object {
    const payload = key.includes('@') ? { email: key } : { nickname: key };
    return { ...payload, ...additionalData };
  }
}
