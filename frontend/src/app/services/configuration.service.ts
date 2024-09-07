import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { createHeaders } from '../utils/http';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);

  private readonly CONFIGURATION_API = environment.apiUrl + '/configurations/';

  private serverListSubject$ = new BehaviorSubject<any[]>([]);

  get serverList$(): Observable<any[]> {
    return this.serverListSubject$.asObservable();
  }

  set serverList(list: any[]) {
    this.serverListSubject$.next(list);
  }

  getServers(): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${this.CONFIGURATION_API}servers`, { headers });
  }

  getMobs(): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${this.CONFIGURATION_API}mobs`, { headers });
  }

  getLocations(): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${this.CONFIGURATION_API}locations`, { headers });
  }
}
