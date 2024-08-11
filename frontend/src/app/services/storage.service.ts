import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  currentServer: 'Гранас' | 'Энигма' | 'Логрус' = 'Гранас';

  clean(): void {
    window.localStorage.removeItem(environment.localStorage.EMAIL);
    window.localStorage.removeItem(environment.localStorage.NICKNAME);
    window.localStorage.removeItem(environment.localStorage.ACCESS_TOKEN);
  }

  setCurrentServer(server: string) {
    window.localStorage.setItem(environment.localStorage.SERVER, server);
  }

  setLocalStorage(key: string, token: any): void {
    this.clean();

    key.includes('@')
      ? window.localStorage.setItem(environment.localStorage.EMAIL, key)
      : window.localStorage.setItem(environment.localStorage.NICKNAME, key);

    window.localStorage.setItem(environment.localStorage.ACCESS_TOKEN, token);

    if (!window.localStorage.getItem(environment.localStorage.SERVER))
      window.localStorage.setItem(
        environment.localStorage.SERVER,
        this.currentServer
      );
  }

  getLocalStorage(key: string): any {
    let storageKey = '';

    if (key === 'email') storageKey = environment.localStorage.EMAIL;

    if (key === 'nickname') storageKey = environment.localStorage.NICKNAME;

    if (key === 'token') storageKey = environment.localStorage.ACCESS_TOKEN;

    if (key === 'server') storageKey = environment.localStorage.SERVER;

    const value = window.localStorage.getItem(storageKey);

    return value ? value : '';
  }

  isLoggedIn(): any {
    return !!window.localStorage.getItem(environment.localStorage.ACCESS_TOKEN);
  }
}
