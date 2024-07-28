import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';

const HISTORY_API = environment.apiUrl + '/history/';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  accessToken: string = '';

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  getHistory(server: string) {
    const headers = this.createHeaders();
    return this.http.get(HISTORY_API + 'findAll/' + server, { headers });
  }

  private createHeaders(): HttpHeaders {
    this.accessToken = this.storageService.getSessionStorage('token');
    return new HttpHeaders({ 'Content-Type': 'application/json' }).set(
      'Authorization',
      `Bearer ${this.accessToken}`
    );
  }
}
