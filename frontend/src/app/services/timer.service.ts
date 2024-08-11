import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { TimerItem } from '../interfaces/timer-item';
import { environment } from 'src/environments/environment';
import { createHeaders } from '../utils/http';

const MOB_URL = environment.apiUrl + '/mob/';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private timerListSubject$ = new BehaviorSubject<TimerItem[]>([]);
  private isLoadingSubject$ = new BehaviorSubject<boolean>(true);
  private headerVisibilitySubject$ = new BehaviorSubject<boolean>(false);

  get timerList$(): Observable<TimerItem[]> {
    return this.timerListSubject$.asObservable();
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

  set isLoading(value: boolean) {
    this.isLoadingSubject$.next(value);
  }

  set headerVisibility(visible: boolean) {
    this.headerVisibilitySubject$.next(visible);
  }

  getWorldTime(): Observable<any> {
    return this.http.get(
      `https://api.timezonedb.com/v2.1/get-time-zone?key=${environment.timezoneDb}&format=json&by=zone&zone=UTC`
    );
  }

  createMob(item: any, server: string): Observable<any> {
    let payload = {
      ...item,
      server,
    };
    const headers = createHeaders(this.storageService);
    return this.http.post(MOB_URL, payload, { headers });
  }

  editMob(item: any, server: string): Observable<any> {
    const { currentLocation, ...itemInfo } = item;
    let payload = {
      ...itemInfo,
    };
    const headers = createHeaders(this.storageService);
    return this.http.put(
      `${MOB_URL}${item.mobName}/${server}/${currentLocation}`,
      payload,
      { headers }
    );
  }

  deleteMob(mobName: string, server: string, location: string) {
    const headers = createHeaders(this.storageService);
    return this.http.delete(`${MOB_URL}${mobName}/${server}/${location}`, {
      headers,
    });
  }

  getAllBosses(server: string): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${MOB_URL}${server}`, { headers });
  }

  crashServerBosses(server: string): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.post(`${MOB_URL}crashServer/${server}`, {}, { headers });
  }

  setByDeathTime(item: TimerItem, dateOfDeath: number): Observable<any> {
    const headers = createHeaders(this.storageService);
    let payload = {
      dateOfDeath,
      mobName: item.mob.mobName,
      server: item.mob.server,
      location: item.mob.location,
    };

    return this.http.put(`${MOB_URL}updateMobDateOfDeath`, payload, {
      headers,
    });
  }

  setByRespawnTime(item: TimerItem, dateOfRespawn: number): Observable<any> {
    const headers = createHeaders(this.storageService);
    let payload = {
      dateOfRespawn,
      mobName: item.mob.mobName,
      server: item.mob.server,
      location: item.mob.location,
    };

    return this.http.put(`${MOB_URL}updateMobDateOfRespawn`, payload, {
      headers,
    });
  }

  setByCooldownTime(item: TimerItem, cooldown: number): Observable<any> {
    const headers = createHeaders(this.storageService);
    let payload = {
      mobName: item.mob.mobName,
      server: item.mob.server,
      location: item.mob.location,
      cooldown,
    };

    return this.http.put(`${MOB_URL}updateMobByCooldown`, payload, {
      headers,
    });
  }

  respawnLost(item: TimerItem): Observable<any> {
    const headers = createHeaders(this.storageService);
    let payload = {};

    return this.http.put(
      `${MOB_URL}respawnLost/${item.mob.mobName}/${item.mob.server}/${item.mob.location}`,
      payload,
      {
        headers,
      }
    );
  }
}
