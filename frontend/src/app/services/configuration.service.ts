import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

const CONFIGURATION_API = environment.apiUrl + '/configuration/';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  accessToken: string = '';
  private serverList$ = new BehaviorSubject<any[]>([]);
  serverList = this.serverList$.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  setServerList(list: any[]): void {
    this.serverList$.next(list);
  }

  getServers(): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(CONFIGURATION_API + 'servers', { headers });
  }

  getMobs(): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(CONFIGURATION_API + 'mobs', { headers });
  }

  getLocations(): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(CONFIGURATION_API + 'locations', { headers });
  }

  private createHeaders(): HttpHeaders {
    this.accessToken = this.storageService.getLocalStorage('token');
    return new HttpHeaders({ 'Content-Type': 'application/json' }).set(
      'Authorization',
      `Bearer ${this.accessToken}`
    );
  }
}
