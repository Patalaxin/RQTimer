import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { BehaviorSubject } from 'rxjs';
import { TimerItem } from '../interfaces/timer-item';

const HISTORY_API = environment.apiUrl + '/history/';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  accessToken: string = '';
  private historyList$ = new BehaviorSubject<any>([]);
  historyList = this.historyList$.asObservable();
  private isLoading$ = new BehaviorSubject<boolean>(true);
  isLoading = this.isLoading$.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  setIsLoading(value: boolean) {
    this.isLoading$.next(value);
  }

  setHistoryList(list: any) {
    this.historyList$.next(list);
  }

  getHistory(server: string, mobName?: string, page?: number, limit?: number) {
    const headers = this.createHeaders();
    let params = new HttpParams();

    if (mobName) {
      params = params.set('mobName', mobName);
    }

    if (page) {
      params = params.set('page', page);
    }

    if (limit) {
      params = params.set('limit', limit);
    }

    return this.http.get(HISTORY_API + 'findAll/' + server, {
      params,
      headers,
    });
  }

  private createHeaders(): HttpHeaders {
    this.accessToken = this.storageService.getSessionStorage('token');
    return new HttpHeaders({ 'Content-Type': 'application/json' }).set(
      'Authorization',
      `Bearer ${this.accessToken}`
    );
  }
}
