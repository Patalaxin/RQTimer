import { Injectable } from '@angular/core';

const EMAIL = 'email';
const NICKNAME = 'nickname';
const ACCESS_TOKEN = 'access-token';
const SERVER = 'server';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  currentServer: 'Гранас' | 'Энигма' | 'Логрус' = 'Гранас';

  constructor() {}

  clean(): void {
    // window.sessionStorage.clear();
    window.sessionStorage.removeItem(EMAIL);
    window.sessionStorage.removeItem(NICKNAME);
    window.sessionStorage.removeItem(ACCESS_TOKEN);
  }

  setCurrentServer(server: string) {
    window.sessionStorage.setItem(SERVER, JSON.stringify(server));
  }

  setSessionStorage(key: string, token: any): void {
    this.clean();

    if (key.includes('@')) {
      window.sessionStorage.setItem(EMAIL, JSON.stringify(key));
    } else {
      window.sessionStorage.setItem(NICKNAME, JSON.stringify(key));
    }

    window.sessionStorage.setItem(ACCESS_TOKEN, JSON.stringify(token));

    if (!window.sessionStorage.getItem(SERVER)) {
      window.sessionStorage.setItem(SERVER, JSON.stringify(this.currentServer));
    }
  }

  getSessionStorage(key: string): any {
    const sessionStorage = {
      email: window.sessionStorage.getItem(EMAIL),
      nickname: window.sessionStorage.getItem(NICKNAME),
      token: window.sessionStorage.getItem(ACCESS_TOKEN),
      server: window.sessionStorage.getItem(SERVER),
    };

    if (sessionStorage.email && key === 'email') {
      return JSON.parse(sessionStorage.email);
    }

    if (sessionStorage.nickname && key === 'nickname') {
      return JSON.parse(sessionStorage.nickname);
    }

    if (sessionStorage.token && key === 'token') {
      return JSON.parse(sessionStorage.token);
    }

    if (sessionStorage.server && key === 'server') {
      return JSON.parse(sessionStorage.server);
    }

    return {};
  }

  isLoggedIn(): any {
    const token = window.sessionStorage.getItem(ACCESS_TOKEN);
    if (token) {
      return true;
    }

    return false;
  }
}
