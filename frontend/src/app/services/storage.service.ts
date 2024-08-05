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

  clean(): void {
    // window.sessionStorage.clear();
    window.sessionStorage.removeItem(EMAIL);
    window.sessionStorage.removeItem(NICKNAME);
    window.sessionStorage.removeItem(ACCESS_TOKEN);
  }

  setCurrentServer(server: string) {
    window.localStorage.setItem(SERVER, server);
  }

  setSessionStorage(key: string, token: any): void {
    this.clean();

    if (key.includes('@')) {
      window.sessionStorage.setItem(EMAIL, key);
    } else {
      window.sessionStorage.setItem(NICKNAME, key);
    }

    window.sessionStorage.setItem(ACCESS_TOKEN, token);

    if (!window.localStorage.getItem(SERVER)) {
      window.localStorage.setItem(SERVER, this.currentServer);
    }
  }

  getSessionStorage(key: string): any {
    const sessionStorage = {
      email: window.sessionStorage.getItem(EMAIL),
      nickname: window.sessionStorage.getItem(NICKNAME),
      token: window.sessionStorage.getItem(ACCESS_TOKEN),
      server: window.localStorage.getItem(SERVER),
    };

    if (sessionStorage.email && key === 'email') {
      return sessionStorage.email;
    }

    if (sessionStorage.nickname && key === 'nickname') {
      return sessionStorage.nickname;
    }

    if (sessionStorage.token && key === 'token') {
      return sessionStorage.token;
    }

    if (sessionStorage.server && key === 'server') {
      return sessionStorage.server;
    }

    return '';
  }

  isLoggedIn(): any {
    return !!window.sessionStorage.getItem(ACCESS_TOKEN);
  }
}
