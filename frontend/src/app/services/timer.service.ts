import { HttpClient } from '@angular/common/http';
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
  private readonly storageService = inject(StorageService);

  private readonly MOB_URL = environment.apiUrl + '/mobs';

  private timerListSubject$ = new BehaviorSubject<TimerItem[]>([]);
  filteredTimerListSubject$ = new BehaviorSubject<TimerItem[]>([]);
  private isLoadingSubject$ = new BehaviorSubject<boolean>(true);
  private headerVisibilitySubject$ = new BehaviorSubject<boolean>(false);

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

  getUnixtime(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/unixtime`);
  }

  addMobGroup(server: string, mobs: string[]): Observable<any> {
    const payload = { mobs };
    return this.http.post(`${this.MOB_URL}/add-in-group/${server}`, payload);
  }

  deleteMobGroup(
    server: string,
    location: string,
    mobName: string,
  ): Observable<any> {
    const payload = {};
    return this.http.delete(
      `${this.MOB_URL}/remove-from-group/${server}/${location}/${mobName}`,
      payload,
    );
  }

  getMob(mobName: string, server: string, location: string) {
    return this.http.get(`${this.MOB_URL}/${server}/${location}/${mobName}`);
  }

  getAllBosses(server: string): Observable<any> {
    return this.http.get(`${this.MOB_URL}/${server}`);
  }

  getAvailableBosses(): Observable<any> {
    return this.http.get(`${this.MOB_URL}`);
  }

  crashServerBosses(server: string): Observable<any> {
    const payload = {};
    return this.http.post(`${this.MOB_URL}/crash-server/${server}`, payload);
  }

  setByDeathTime(item: TimerItem, dateOfDeath: number): Observable<any> {
    let payload = {
      dateOfDeath,
      mobName: item.mob.mobName,
      server: item.mobData.server,
      location: item.mob.location,
    };

    return this.http.put(`${this.MOB_URL}/date-of-death`, payload);
  }

  setByRespawnTime(item: TimerItem, dateOfRespawn: number): Observable<any> {
    let payload = {
      dateOfRespawn,
      mobName: item.mob.mobName,
      server: item.mobData.server,
      location: item.mob.location,
    };

    return this.http.put(`${this.MOB_URL}/date-of-respawn`, payload);
  }

  setByCooldownTime(item: TimerItem, cooldown: number): Observable<any> {
    let payload = {
      mobName: item.mob.mobName,
      server: item.mobData.server,
      location: item.mob.location,
      cooldown,
    };

    return this.http.put(`${this.MOB_URL}/cooldown`, payload);
  }

  respawnLost(item: TimerItem): Observable<any> {
    let payload = {};

    return this.http.put(
      `${this.MOB_URL}/respawn-lost/${item.mobData.server}/${item.mob.location}/${item.mob.mobName}`,
      payload,
    );
  }
}
