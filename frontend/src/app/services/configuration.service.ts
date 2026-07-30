import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { IGetMobsResponse } from 'src/app/interfaces/mob-catalog-entry';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly CONFIGURATION_API = environment.apiUrl + '/configurations/';

  private serverListSubject$ = new BehaviorSubject<
    { label: string; value: string }[]
  >([]);

  get serverList$(): Observable<{ label: string; value: string }[]> {
    return this.serverListSubject$.asObservable();
  }

  set serverList(list: { label: string; value: string }[]) {
    this.serverListSubject$.next(list);
  }

  getServers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.CONFIGURATION_API}servers`);
  }

  getMobs(lang: string): Observable<IGetMobsResponse> {
    let params = new HttpParams();

    if (lang) params = params.set('lang', lang);

    return this.http.get<IGetMobsResponse>(`${this.CONFIGURATION_API}mobs`, {
      params,
    });
  }

  getLocations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.CONFIGURATION_API}locations`);
  }
}
