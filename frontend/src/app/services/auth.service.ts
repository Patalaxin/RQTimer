import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const AUTH_API = environment.apiUrl + '/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

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
    return this.http.post(`${AUTH_API}/login`, payload, this.httpOptions);
  }

  exchangeRefresh(key: string): Observable<any> {
    const payload = this.createPayload(key);
    return this.http.post(
      `${AUTH_API}/exchangeRefresh`,
      payload,
      this.httpOptions
    );
  }

  signOut(): Observable<any> {
    return this.http.get(`${AUTH_API}/signout`, this.httpOptions);
  }
}
