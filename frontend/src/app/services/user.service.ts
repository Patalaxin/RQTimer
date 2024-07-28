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

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  getUser(): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(USER_API, { headers });
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

  updateExcluded(excludedMobs: string[]): Observable<any> {
    let payload = {
      excludedMobs,
    };
    const headers = this.createHeaders();
    return this.http.put(USER_API + 'updateExcluded', payload, { headers });
  }

  private createHeaders(): HttpHeaders {
    this.accessToken = this.storageService.getSessionStorage('token');
    return new HttpHeaders({ 'Content-Type': 'application/json' }).set(
      'Authorization',
      `Bearer ${this.accessToken}`
    );
  }
}
