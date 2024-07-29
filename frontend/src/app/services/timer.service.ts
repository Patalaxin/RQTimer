import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { TimerItem } from '../interfaces/timer-item';
import { environment } from 'src/environments/environment';

const MOB_URL = environment.apiUrl + '/mob/';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  accessToken: string = '';
  private timerList$ = new BehaviorSubject<TimerItem[]>([]);
  timerList = this.timerList$.asObservable();
  private isLoading$ = new BehaviorSubject<boolean>(true);
  isLoading = this.isLoading$.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  setTimerList(list: TimerItem[]) {
    this.timerList$.next(list);
  }

  setIsLoading(value: boolean): void {
    this.isLoading$.next(value);
  }

  getAllBosses(server: string): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(MOB_URL + `${server}`, { headers });
  }

  crashServerBosses(server: string): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(
      MOB_URL + 'crashServer/' + `${server}`,
      {},
      { headers }
    );
  }

  setByDeathTime(item: TimerItem, dateOfDeath: number): Observable<any> {
    const headers = this.createHeaders();
    let payload = {
      dateOfDeath,
      mobName: item.mob.mobName,
      server: item.mob.server,
      location: item.mob.location,
    };

    return this.http.put(MOB_URL + 'updateMobDateOfDeath', payload, {
      headers,
    });
  }

  setByRespawnTime(item: TimerItem, dateOfRespawn: number): Observable<any> {
    const headers = this.createHeaders();
    let payload = {
      dateOfRespawn,
      mobName: item.mob.mobName,
      server: item.mob.server,
      location: item.mob.location,
    };

    return this.http.put(MOB_URL + 'updateMobDateOfRespawn', payload, {
      headers,
    });
  }

  setByCooldownTime(item: TimerItem, cooldown: number): Observable<any> {
    const headers = this.createHeaders();
    let payload = {
      mobName: item.mob.mobName,
      server: item.mob.server,
      location: item.mob.location,
      cooldown,
    };

    return this.http.put(MOB_URL + 'updateMobByCooldown', payload, {
      headers,
    });
  }

  // updateCooldownCounter(item: TimerItem, cooldown: number): Observable<any> {
  //   const headers = this.createHeaders();
  //   let payload = {
  //     mobName: item.mob.mobName,
  //     server: item.mob.server,
  //     location: item.mob.location,
  //     cooldown,
  //   };

  //   return this.http.put(MOB_URL + 'updateMobCooldownCounter', payload, {
  //     headers,
  //   });
  // }

  respawnLost(item: TimerItem): Observable<any> {
    const headers = this.createHeaders();
    let payload = {};

    console.log(
      'respawnLost/' +
        item.mob.mobName +
        '/' +
        item.mob.location +
        '/' +
        item.mob.server
    );

    return this.http.put(
      MOB_URL +
        'respawnLost/' +
        item.mob.mobName +
        '/' +
        item.mob.server +
        '/' +
        item.mob.location,
      payload,
      {
        headers,
      }
    );
  }

  private createHeaders(): HttpHeaders {
    this.accessToken = this.storageService.getSessionStorage('token');
    return new HttpHeaders({ 'Content-Type': 'application/json' }).set(
      'Authorization',
      `Bearer ${this.accessToken}`
    );
  }
}
