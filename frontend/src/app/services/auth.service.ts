import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const AUTH_API = environment.apiUrl + '/auth';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(key: string, password: string): Observable<any> {
    let payload = {};
    if (key.includes('@')) {
      payload = {
        email: key,
        password,
      };
    } else {
      payload = {
        nickname: key,
        password,
      };
    }
    return this.http.post(AUTH_API + '/login', payload, httpOptions);
  }

  exchangeRefresh(key: string): Observable<any> {
    console.log(key);
    let payload = {};
    if (key.includes('@')) {
      payload = {
        email: key,
      };
    } else {
      payload = {
        nickname: key,
      };
    }
    return this.http.post(AUTH_API + '/exchangeRefresh', payload, httpOptions);
  }
}
