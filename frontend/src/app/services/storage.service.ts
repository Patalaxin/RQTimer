import { inject, Injectable } from '@angular/core';

const EMAIL: string = 'email';
const NICKNAME: string = 'nickname';
const ACCESS_TOKEN: string = 'token';
const SERVER: string = 'server';
const NOTIFICATION: string = 'notification';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  currentServer: 'Helios' | 'Fenix' | 'Solus' =
    'Helios';

  clean(): void {
    window.localStorage.removeItem(EMAIL);
    window.localStorage.removeItem(NICKNAME);
    window.localStorage.removeItem(ACCESS_TOKEN);
  }

  setCurrentServer(server: string) {
    window.localStorage.setItem(SERVER, server);
  }

  setViewedNotifications(id: string) {
    const existing = window.localStorage.getItem(NOTIFICATION);
    const arr: string[] = existing ? JSON.parse(existing) : [];
    if (!arr.includes(id)) {
      arr.push(id);
      window.localStorage.setItem(NOTIFICATION, JSON.stringify(arr));
    }
  }

  setLocalStorage(key: string, token?: any): void {
    key.includes('@')
      ? window.localStorage.setItem(EMAIL, key)
      : window.localStorage.setItem(NICKNAME, key);

    window.localStorage.setItem(ACCESS_TOKEN, token);

    if (!window.localStorage.getItem(SERVER))
      window.localStorage.setItem(SERVER, this.currentServer);
  }

  getLocalStorage(
    key:
      | 'email'
      | 'nickname'
      | 'token'
      | 'server'
      | 'timezone'
      | 'notification',
  ): any {
    const value = window.localStorage.getItem(key);
    return value ?? '';
  }

  isLoggedIn(): any {
    return !!window.localStorage.getItem(ACCESS_TOKEN);
  }
}
