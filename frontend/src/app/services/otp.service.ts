import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OtpService {
  private readonly http = inject(HttpClient);

  private readonly OTP_API = environment.apiUrl + '/otp';

  private get httpOptions() {
    return {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true,
    };
  }

  sendOTP(email: string): Observable<any> {
    const payload = { email };
    return this.http.post(`${this.OTP_API}`, payload, this.httpOptions);
  }

  verifyOTP(email: string, otp: string): Observable<any> {
    const payload = { email, otp };
    return this.http.post(`${this.OTP_API}/verify`, payload, this.httpOptions);
  }
}
