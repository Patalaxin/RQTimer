import { inject, Injectable } from '@angular/core';
import * as moment from 'moment';
import { UserService } from './user.service';

const EMAIL: string = 'email';
const NICKNAME: string = 'nickname';
const ACCESS_TOKEN: string = 'token';
const SERVER: string = 'server';
const TIMEZONE: string = 'timezone';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly userService = inject(UserService);

  currentServer: 'Гелиос' | 'Игнис' | 'Astus' | 'Pyros' | 'Aztec' | 'Ortos' =
    'Гелиос';

  clean(): void {
    window.localStorage.removeItem(EMAIL);
    window.localStorage.removeItem(NICKNAME);
    window.localStorage.removeItem(ACCESS_TOKEN);
  }

  setCurrentServer(server: string) {
    window.localStorage.setItem(SERVER, server);
  }

  setLocalStorage(key: string, token?: any): void {
    let userTimezone = moment.tz.guess();

    key.includes('@')
      ? window.localStorage.setItem(EMAIL, key)
      : window.localStorage.setItem(NICKNAME, key);

    window.localStorage.setItem(ACCESS_TOKEN, token);

    if (!window.localStorage.getItem(SERVER))
      window.localStorage.setItem(SERVER, this.currentServer);

    if (window.localStorage.getItem(TIMEZONE)) {
      if (window.localStorage.getItem(TIMEZONE) !== userTimezone) {
        window.localStorage.setItem('timezone', userTimezone);
        this.userService.setUserTimezone(userTimezone).subscribe();
      }
    }

    if (!window.localStorage.getItem(TIMEZONE)) {
      window.localStorage.setItem(TIMEZONE, userTimezone);
      this.userService.setUserTimezone(userTimezone).subscribe();
    }
  }

  getLocalStorage(
    key: 'email' | 'nickname' | 'token' | 'server' | 'timezone',
  ): any {
    const value = window.localStorage.getItem(key);
    return value ?? '';
  }

  isLoggedIn(): any {
    return !!window.localStorage.getItem(ACCESS_TOKEN);
  }
}
