import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly AUTH_API = environment.apiUrl + '/auth';

  private get httpOptions() {
    return {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true,
    };
  }

  private createPayload(key: string, password?: string): any {
    return key.includes('@')
      ? { email: key, password }
      : { nickname: key, password };
  }

  login(key: string, password: string): Observable<any> {
    const payload = this.createPayload(key, password);
    return this.http.post(`${this.AUTH_API}/login`, payload, this.httpOptions);
  }

  exchangeRefresh(key: string): Observable<any> {
    const payload = this.createPayload(key);
    return this.http.post(
      `${this.AUTH_API}/exchange-refresh`,
      payload,
      this.httpOptions,
    );
  }

  signOut(): Observable<any> {
    return this.http.get(`${this.AUTH_API}/signout`, this.httpOptions);
  }
}
