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
    // window.localStorage.clear();
    window.localStorage.removeItem(EMAIL);
    window.localStorage.removeItem(NICKNAME);
    window.localStorage.removeItem(ACCESS_TOKEN);
  }

  setCurrentServer(server: string) {
    window.localStorage.setItem(SERVER, server);
  }

  setLocalStorage(key: string, token: any): void {
    this.clean();

    if (key.includes('@')) {
      window.localStorage.setItem(EMAIL, key);
    } else {
      window.localStorage.setItem(NICKNAME, key);
    }

    window.localStorage.setItem(ACCESS_TOKEN, token);

    if (!window.localStorage.getItem(SERVER)) {
      window.localStorage.setItem(SERVER, this.currentServer);
    }
  }

  getLocalStorage(key: string): any {
    const localStorage = {
      email: window.localStorage.getItem(EMAIL),
      nickname: window.localStorage.getItem(NICKNAME),
      token: window.localStorage.getItem(ACCESS_TOKEN),
      server: window.localStorage.getItem(SERVER),
    };

    if (localStorage.email && key === 'email') {
      return localStorage.email;
    }

    if (localStorage.nickname && key === 'nickname') {
      return localStorage.nickname;
    }

    if (localStorage.token && key === 'token') {
      return localStorage.token;
    }

    if (localStorage.server && key === 'server') {
      return localStorage.server;
    }

    return '';
  }

  isLoggedIn(): any {
    return !!window.localStorage.getItem(ACCESS_TOKEN);
  }
}
