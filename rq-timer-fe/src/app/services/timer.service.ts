import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { TimerItem } from '../interfaces/timer-item';

const BOSS_URL = 'http://localhost:3000/boss/';
const ELITE_URL = 'http://localhost:3000/elite/';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  accessToken: string = '';
  private timerList$ = new BehaviorSubject<TimerItem[]>([]);
  timerList = this.timerList$.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  setTimerList(list: TimerItem[]) {
    this.timerList$.next(list);
  }

  getAllBosses(server: string): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(BOSS_URL + 'findAll/' + `${server}`, { headers });
  }

  getAllElites(server: string): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(ELITE_URL + 'findAll/' + `${server}`, { headers });
  }

  crashServerBosses(server: string): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(
      BOSS_URL + 'crashServer/' + `${server}`,
      {},
      { headers }
    );
  }

  crashServerElites(server: string): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(
      ELITE_URL + 'crashServer/' + `${server}`,
      {},
      {
        headers,
      }
    );
  }

  setByDeathTime(item: TimerItem, dateOfDeath: number): Observable<any> {
    const headers = this.createHeaders();
    let payload = {
      dateOfDeath,
      bossName: item.bossName,
      server: item.server,
    };
    if (item.mobType === 'Элитка') {
      let payload = {
        dateOfDeath,
        eliteName: item.eliteName,
        server: item.server,
      };
      return this.http.put(ELITE_URL + 'updateDeathOfElite', payload, {
        headers,
      });
    }

    return this.http.put(BOSS_URL + 'updateDeathOfBoss', payload, { headers });
  }

  setByRespawnTime(item: TimerItem, dateOfRespawn: number): Observable<any> {
    const headers = this.createHeaders();
    let payload = {
      dateOfRespawn,
      bossName: item.bossName,
      server: item.server,
    };
    if (item.mobType === 'Элитка') {
      let payload = {
        dateOfRespawn,
        eliteName: item.eliteName,
        server: item.server,
      };
      return this.http.put(ELITE_URL + 'updateDeathOfElite', payload, {
        headers,
      });
    }

    return this.http.put(BOSS_URL + 'updateDeathOfBoss', payload, { headers });
  }

  setByCooldownTime(item: TimerItem): Observable<any> {
    const headers = this.createHeaders();
    let payload = {
      bossName: item.bossName,
      server: item.server,
    };
    if (item.mobType === 'Элитка') {
      let payload = {
        eliteName: item.eliteName,
        server: item.server,
      };
      return this.http.put(ELITE_URL + 'updateDeathOfElite', payload, {
        headers,
      });
    }

    return this.http.put(BOSS_URL + 'updateDeathOfBoss', payload, { headers });
  }

  private createHeaders(): HttpHeaders {
    this.accessToken = this.storageService.getSessionStorage('token');
    return new HttpHeaders({ 'Content-Type': 'application/json' }).set(
      'Authorization',
      `Bearer ${this.accessToken}`
    );
  }
}
