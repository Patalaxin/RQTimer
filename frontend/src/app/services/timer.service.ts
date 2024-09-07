import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { TimerItem } from '../interfaces/timer-item';
import { environment } from 'src/environments/environment';
import { createHeaders } from '../utils/http';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);

  private readonly MOB_URL = environment.apiUrl + '/mobs/';

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
      `https://api.timezonedb.com/v2.1/get-time-zone?key=${environment.timezoneDb}&format=json&by=zone&zone=UTC`,
    );
  }

  createMob(item: any, server: string): Observable<any> {
    let payload = {
      ...item,
      server,
    };
    const headers = createHeaders(this.storageService);
    return this.http.post(this.MOB_URL, payload, { headers });
  }

  editMob(item: any, server: string): Observable<any> {
    const { currentLocation, ...itemInfo } = item;
    let payload = itemInfo;
    const headers = createHeaders(this.storageService);
    return this.http.put(
      `${this.MOB_URL}/${server}/${currentLocation}/${item.mobName}`,
      payload,
      { headers },
    );
  }

  deleteMob(mobName: string, server: string, location: string) {
    const headers = createHeaders(this.storageService);
    return this.http.delete(
      `${this.MOB_URL}/${server}/${location}/${mobName}`,
      {
        headers,
      },
    );
  }

  getAllBosses(server: string): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.get(`${this.MOB_URL}${server}`, { headers });
  }

  crashServerBosses(server: string): Observable<any> {
    const headers = createHeaders(this.storageService);
    return this.http.post(
      `${this.MOB_URL}crash-server/${server}`,
      {},
      { headers },
    );
  }

  setByDeathTime(item: TimerItem, dateOfDeath: number): Observable<any> {
    const headers = createHeaders(this.storageService);
    let payload = {
      dateOfDeath,
      mobName: item.mob.mobName,
      server: item.mob.server,
      location: item.mob.location,
    };

    return this.http.put(`${this.MOB_URL}date-of-death`, payload, {
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

    return this.http.put(`${this.MOB_URL}date-of-respawn`, payload, {
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

    return this.http.put(`${this.MOB_URL}cooldown`, payload, {
      headers,
    });
  }

  respawnLost(item: TimerItem): Observable<any> {
    const headers = createHeaders(this.storageService);
    let payload = {};

    return this.http.put(
      `${this.MOB_URL}respawn-lost/${item.mob.server}/${item.mob.location}/${item.mob.mobName}`,
      payload,
      {
        headers,
      },
    );
  }
}
