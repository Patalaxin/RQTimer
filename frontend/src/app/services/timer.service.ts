import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { TimerItem } from '../interfaces/timer-item';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private readonly http = inject(HttpClient);

  private readonly MOB_URL = environment.apiUrl + '/mobs';
  private timerListSubject$ = new BehaviorSubject<TimerItem[]>([]);
  private filteredTimerListSubject$ = new BehaviorSubject<TimerItem[]>([]);
  private isLoadingSubject$ = new BehaviorSubject<boolean>(true);
  private headerVisibilitySubject$ = new BehaviorSubject<boolean>(false);
  private telegramBotVisibilitySubject$ = new BehaviorSubject<boolean>(false);

  get timerList$(): Observable<TimerItem[]> {
    return this.timerListSubject$.asObservable();
  }

  get filteredTimerList$(): Observable<TimerItem[]> {
    return this.filteredTimerListSubject$.asObservable();
  }

  get isLoading$(): Observable<boolean> {
    return this.isLoadingSubject$.asObservable();
  }

  get headerVisibility$(): Observable<boolean> {
    return this.headerVisibilitySubject$.asObservable();
  }

  get telegramBotVisibility$(): Observable<boolean> {
    return this.telegramBotVisibilitySubject$.asObservable();
  }

  set timerList(list: TimerItem[]) {
    this.timerListSubject$.next(list);
  }

  set filteredTimerList(list: TimerItem[]) {
    this.filteredTimerListSubject$.next(list);
  }

  set isLoading(value: boolean) {
    this.isLoadingSubject$.next(value);
  }

  set headerVisibility(visible: boolean) {
    this.headerVisibilitySubject$.next(visible);
  }

  set telegramBotVisibility(visible: boolean) {
    this.telegramBotVisibilitySubject$.next(visible);
  }

  getUnixtime(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/unixtime`);
  }

  addMobGroup(server: string, mobs: string[]): Observable<any> {
    const payload = { mobs };
    return this.http.post(`${this.MOB_URL}/${server}/add-in-group`, payload);
  }

  deleteMobGroup(server: string, mobId: string): Observable<any> {
    const payload = {};
    return this.http.delete(
      `${this.MOB_URL}/${server}/${mobId}/remove-from-group`,
      payload,
    );
  }

  getMob(mobId: string, server: string, lang: string) {
    let params = new HttpParams();

    if (lang) params = params.set('lang', lang);

    return this.http.get(`${this.MOB_URL}/${server}/${mobId}`, {
      params,
    });
  }

  getAllBosses(server: string, lang: string): Observable<any> {
    let params = new HttpParams();

    if (lang) params = params.set('lang', lang);

    return this.http.get(`${this.MOB_URL}/${server}`, {
      params,
    });
  }

  getAvailableBosses(lang: string): Observable<any> {
    let params = new HttpParams();

    if (lang) params = params.set('lang', lang);

    return this.http.get(`${this.MOB_URL}`, {
      params,
    });
  }

  crashServerBosses(server: string): Observable<any> {
    const payload = {};
    return this.http.post(`${this.MOB_URL}/${server}/crash-server`, payload);
  }

  setByDeathTime(
    item: TimerItem,
    dateOfDeath: number,
    comment: string,
  ): Observable<any> {
    let payload = {
      dateOfDeath,
      comment,
    };

    return this.http.put(
      `${this.MOB_URL}/${item.mobData.server}/${item.mobData.mobId}/date-of-death`,
      payload,
    );
  }

  setByRespawnTime(
    item: TimerItem,
    dateOfRespawn: number,
    comment: string,
  ): Observable<any> {
    let payload = {
      dateOfRespawn,
      comment,
    };

    return this.http.put(
      `${this.MOB_URL}/${item.mobData.server}/${item.mobData.mobId}/date-of-respawn`,
      payload,
    );
  }

  setByCooldownTime(
    item: TimerItem,
    cooldown: number,
    comment: string,
  ): Observable<any> {
    let payload = {
      cooldown,
      comment,
    };

    return this.http.put(
      `${this.MOB_URL}/${item.mobData.server}/${item.mobData.mobId}/cooldown`,
      payload,
    );
  }

  respawnLost(item: TimerItem): Observable<any> {
    let payload = {};

    return this.http.put(
      `${this.MOB_URL}/${item.mobData.server}/${item.mobData.mobId}/respawn-lost`,
      payload,
    );
  }

  addComment(item: TimerItem, comment: string): Observable<any> {
    let payload = { comment };

    return this.http.put(
      `${this.MOB_URL}/${item.mobData.server}/${item.mobData.mobId}/comment`,
      payload,
    );
  }
}
