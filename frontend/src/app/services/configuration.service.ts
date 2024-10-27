import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

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
    return this.http.get(`${this.CONFIGURATION_API}servers`);
  }

  getMobs(): Observable<any> {
    return this.http.get(`${this.CONFIGURATION_API}mobs`);
  }

  getLocations(): Observable<any> {
    return this.http.get(`${this.CONFIGURATION_API}locations`);
  }
}
