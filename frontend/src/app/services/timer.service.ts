import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { ITimerItem, IFullMob } from '../interfaces/timer-item';
import { RespawnInput } from '../interfaces/respawn-input';
import { IMobCatalog } from '../interfaces/mob-catalog-entry';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private readonly http = inject(HttpClient);

  private readonly MOB_URL = environment.apiUrl + '/mobs';
  private timerListSubject$ = new BehaviorSubject<ITimerItem[]>([]);
  private filteredTimerListSubject$ = new BehaviorSubject<ITimerItem[]>([]);
  private isLoadingSubject$ = new BehaviorSubject<boolean>(true);
  private headerVisibilitySubject$ = new BehaviorSubject<boolean>(false);
  private telegramBotVisibilitySubject$ = new BehaviorSubject<boolean>(false);
  private groupNameSubject$ = new BehaviorSubject<string>('');
  private switchVoiceSubject$ = new BehaviorSubject<boolean>(
    JSON.parse(localStorage.getItem('specialNotification') || 'false'),
  );

  get timerList$(): Observable<ITimerItem[]> {
    return this.timerListSubject$.asObservable();
  }

  get filteredTimerList$(): Observable<ITimerItem[]> {
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

  get groupName$(): Observable<string> {
    return this.groupNameSubject$.asObservable();
  }

  get switchVoice$(): Observable<boolean> {
    return this.switchVoiceSubject$.asObservable();
  }

  set timerList(list: ITimerItem[]) {
    this.timerListSubject$.next(list);
  }

  set filteredTimerList(list: ITimerItem[]) {
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

  set groupName(groupName: string) {
    this.groupNameSubject$.next(groupName);
  }

  set switchVoice(enable: boolean) {
    this.switchVoiceSubject$.next(enable);
  }

  getUnixtime(): Observable<{ unixtime: number }> {
    return this.http.get<{ unixtime: number }>(
      `${environment.apiUrl}/unixtime`,
    );
  }

  addMobGroup(server: string, mobs: string[]): Observable<ITimerItem[]> {
    const payload = { mobs };
    return this.http.post<ITimerItem[]>(
      `${this.MOB_URL}/${server}/add-in-group`,
      payload,
    );
  }

  deleteMobGroup(
    server: string,
    mobId: string,
  ): Observable<{ message: string }> {
    const payload = {};
    return this.http.delete<{ message: string }>(
      `${this.MOB_URL}/${server}/${mobId}/remove-from-group`,
      payload,
    );
  }

  getMob(mobId: string, lang?: string): Observable<{ mob: IMobCatalog }> {
    let params = new HttpParams();

    if (lang) params = params.set('lang', lang);

    return this.http.get<{ mob: IMobCatalog }>(`${this.MOB_URL}/${mobId}`, {
      params,
    });
  }

  getAllBosses(server: string, lang?: string): Observable<ITimerItem[]> {
    let params = new HttpParams();

    if (lang) params = params.set('lang', lang);

    return this.http.get<ITimerItem[]>(`${this.MOB_URL}/server/${server}`, {
      params,
    });
  }

  getAvailableBosses(lang?: string): Observable<IMobCatalog[]> {
    let params = new HttpParams();

    if (lang) params = params.set('lang', lang);

    return this.http.get<IMobCatalog[]>(`${this.MOB_URL}`, {
      params,
    });
  }

  crashServerBosses(server: string): Observable<IFullMob[]> {
    const payload = {};
    return this.http.post<IFullMob[]>(
      `${this.MOB_URL}/${server}/crash-server`,
      payload,
    );
  }

  setByDeathTime(
    item: ITimerItem,
    dateOfDeath: number,
    comment: string,
  ): Observable<IFullMob> {
    return this.setRespawn(
      item,
      RespawnInput.dateOfDeath,
      dateOfDeath,
      comment,
    );
  }

  setByRespawnTime(
    item: ITimerItem,
    dateOfRespawn: number,
    comment: string,
  ): Observable<IFullMob> {
    return this.setRespawn(
      item,
      RespawnInput.dateOfRespawn,
      dateOfRespawn,
      comment,
    );
  }

  setByCooldownTime(
    item: ITimerItem,
    cooldown: number,
    comment: string,
  ): Observable<IFullMob> {
    return this.setRespawn(item, RespawnInput.cooldown, cooldown, comment);
  }

  /**
   * Раньше на каждое представление была своя ручка со своим телом запроса.
   * Теперь ручка одна, а представление уезжает полем `by` — значение при этом
   * читается по-разному, поэтому обёртки выше остаются: они не дают перепутать
   * число кулдаунов с моментом времени.
   */
  private setRespawn(
    item: ITimerItem,
    by: RespawnInput,
    value: number,
    comment: string,
  ): Observable<IFullMob> {
    let payload = {
      by,
      value,
      comment,
    };

    return this.http.put<IFullMob>(
      `${this.MOB_URL}/${item.mobData.server}/${item.mobData.mobId}/respawn`,
      payload,
    );
  }

  respawnLost(item: ITimerItem): Observable<IFullMob> {
    let payload = {};

    return this.http.put<IFullMob>(
      `${this.MOB_URL}/${item.mobData.server}/${item.mobData.mobId}/respawn-lost`,
      payload,
    );
  }

  addComment(item: ITimerItem, comment: string): Observable<IFullMob> {
    let payload = { comment };

    return this.http.put<IFullMob>(
      `${this.MOB_URL}/${item.mobData.server}/${item.mobData.mobId}/comment`,
      payload,
    );
  }
}
