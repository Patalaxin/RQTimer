import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { environment } from 'src/environments/environment';

const USER_API = environment.apiUrl + '/user/';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  accessToken: string = '';
  private currentUser$ = new BehaviorSubject<any[]>([]);
  currentUser = this.currentUser$.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  setCurrentUser(user: any[]) {
    this.currentUser$.next(user);
  }

  getUser(): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(USER_API, { headers });
  }

  getAllUsers(): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(USER_API + 'findAll', { headers });
  }

  getSpecificUser(key: string): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(USER_API + 'specificUser/' + key, { headers });
  }

  createUser(
    nickname: string,
    email: string,
    password: string,
    sessionId: string,
    excludedMobs: string[]
  ): Observable<any> {
    let payload = {
      nickname,
      email,
      password,
      sessionId,
      excludedMobs,
    };
    const headers = this.createHeaders();
    return this.http.post(USER_API, payload, { headers });
  }

  deleteUser(key: string): Observable<any> {
    const headers = this.createHeaders();
    return this.http.delete(USER_API + key, { headers });
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
    const headers = this.createHeaders();
    return this.http.put(USER_API + 'forgotPassword', payload, { headers });
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    let payload = {
      oldPassword,
      newPassword,
    };
    const headers = this.createHeaders();
    return this.http.put(USER_API + 'changePassword', payload, { headers });
  }

  updateRole(key: string, role: string): Observable<any> {
    const headers = this.createHeaders();

    let payload = {};
    if (key.includes('@')) {
      payload = {
        email: key,
        role,
      };
    } else {
      payload = {
        nickname: key,
        role,
      };
    }
    return this.http.put(USER_API + 'updateRole', payload, { headers });
  }

  updateExcluded(excludedMobs: string[]): Observable<any> {
    let payload = {
      excludedMobs,
    };
    const headers = this.createHeaders();
    return this.http.put(USER_API + 'updateExcluded', payload, { headers });
  }

  updateUnavailable(key: string, unavailableMobs: string[]): Observable<any> {
    let payload = {};
    if (key.includes('@')) {
      payload = {
        email: key,
        unavailableMobs,
      };
    } else {
      payload = {
        nickname: key,
        unavailableMobs,
      };
    }

    const headers = this.createHeaders();
    return this.http.put(USER_API + 'updateUnavailable', payload, { headers });
  }

  generateSessionId(): Observable<any> {
    let payload = {};
    const headers = this.createHeaders();
    return this.http.post(USER_API + 'generateSessionId', payload, { headers });
  }

  private createHeaders(): HttpHeaders {
    this.accessToken = this.storageService.getSessionStorage('token');
    return new HttpHeaders({ 'Content-Type': 'application/json' }).set(
      'Authorization',
      `Bearer ${this.accessToken}`
    );
  }
}
