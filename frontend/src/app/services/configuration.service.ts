import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { createHeaders } from '../utils/http';

const CONFIGURATION_API = environment.apiUrl + '/configuration/';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private serverListSubject$ = new BehaviorSubject<any[]>([]);

  get serverList$(): Observable<any[]> {
    return this.serverListSubject$.asObservable();
  }

  set serverList(list: any[]) {
    this.serverListSubject$.next(list);
  }

  getServers(): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${CONFIGURATION_API}servers`, { headers });
  }

  getMobs(): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${CONFIGURATION_API}mobs`, { headers });
  }

  getLocations(): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${CONFIGURATION_API}locations`, { headers });
  }
}
