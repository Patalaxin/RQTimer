import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IAuthTokens } from 'src/app/interfaces/auth-tokens';

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

  private createPayload(
    key: string,
    password?: string,
  ): { email: string; password?: string } | { nickname: string; password?: string } {
    return key.includes('@')
      ? { email: key, password }
      : { nickname: key, password };
  }

  login(key: string, password: string): Observable<IAuthTokens> {
    const payload = this.createPayload(key, password);
    return this.http.post<IAuthTokens>(
      `${this.AUTH_API}/login`,
      payload,
      this.httpOptions,
    );
  }

  exchangeRefresh(key: string): Observable<IAuthTokens> {
    const payload = this.createPayload(key);
    return this.http.post<IAuthTokens>(
      `${this.AUTH_API}/exchange-refresh`,
      payload,
      this.httpOptions,
    );
  }

  signOut(): Observable<{ message: string; status: number }> {
    return this.http.get<{ message: string; status: number }>(
      `${this.AUTH_API}/signout`,
      this.httpOptions,
    );
  }
}
