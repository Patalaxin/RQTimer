import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  IHistoryEntry,
  IPaginatedHistory,
} from 'src/app/interfaces/history-entry';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);

  HISTORY_API = environment.apiUrl + '/history/';

  private historyListSubject$ = new BehaviorSubject<IHistoryEntry[]>([]);
  private historyListDataSubject$ = new BehaviorSubject<IPaginatedHistory | null>(
    null,
  );
  private isLoadingSubject$ = new BehaviorSubject<boolean>(true);

  get historyList$(): Observable<IHistoryEntry[]> {
    return this.historyListSubject$.asObservable();
  }

  get historyListData$(): Observable<IPaginatedHistory | null> {
    return this.historyListDataSubject$.asObservable();
  }

  get isLoading$(): Observable<boolean> {
    return this.isLoadingSubject$.asObservable();
  }

  set historyList(list: IHistoryEntry[]) {
    this.historyListSubject$.next(list);
  }

  set historyListData(list: IPaginatedHistory | null) {
    this.historyListDataSubject$.next(list);
  }

  set isLoading(value: boolean) {
    this.isLoadingSubject$.next(value);
  }

  getHistory(
    server: string,
    page?: number,
    limit?: number,
    lang?: string,
    historyType?: string,
  ): Observable<IPaginatedHistory> {
    let params = new HttpParams();

    if (page) params = params.set('page', page);

    if (limit) params = params.set('limit', limit);

    if (lang) params = params.set('lang', lang);

    if (historyType) params = params.set('historyType', historyType);

    return this.http.get<IPaginatedHistory>(
      `${this.HISTORY_API}list/${server}`,
      {
        params,
      },
    );
  }

  getMobHistory(
    server: string,
    mobId: string,
    page?: number,
    limit?: number,
    lang?: string,
  ): Observable<IPaginatedHistory> {
    let params = new HttpParams();

    if (page) params = params.set('page', page);

    if (limit) params = params.set('limit', limit);

    if (lang) params = params.set('lang', lang);

    return this.http.get<IPaginatedHistory>(
      `${this.HISTORY_API}${server}/${mobId}`,
      {
        params,
      },
    );
  }
}
