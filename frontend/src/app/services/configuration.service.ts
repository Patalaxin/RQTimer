import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly CONFIGURATION_API = environment.url + '/configurations/';

  private serverListSubject$ = new BehaviorSubject<any[]>([]);

  get serverList$(): Observable<any[]> {
    return this.serverListSubject$.asObservable();
  }

  set serverList(list: any[]) {
    this.serverListSubject$.next(list);
  }

  getServers(): Observable<any> {
    return this.http.get(`${this.CONFIGURATION_API}servers`);
  }

  getMobs(lang: string): Observable<any> {
    let params = new HttpParams();

    if (lang) params = params.set('lang', lang);

    return this.http.get(`${this.CONFIGURATION_API}mobs`, {
      params,
    });
  }

  getLocations(): Observable<any> {
    return this.http.get(`${this.CONFIGURATION_API}locations`);
  }
}
