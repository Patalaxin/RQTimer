import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subscription } from 'rxjs';
import { TimerItem } from 'src/app/interfaces/timer-item';
import { AuthService } from 'src/app/services/auth.service';
import { HistoryService } from 'src/app/services/history.service';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';
import { TokenService } from 'src/app/services/token.service';
import { UserService } from 'src/app/services/user.service';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);
  private readonly timerService = inject(TimerService);
  private readonly tokenService = inject(TokenService);
  private readonly historyService = inject(HistoryService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly websocketService = inject(WebsocketService);
  private readonly modalService = inject(NzModalService);
  private readonly messageService = inject(NzMessageService);

  currentServer: string = 'Гелиос';
  currentRoute: string = '';
  timerList: TimerItem[] = [];
  historyListData: any = [];
  historyList: any = [];
  tokenRefreshTimeout: any;
  currentUser: any = [];

  isOnlineSubscription: Subscription | undefined;
  isOnline: 'online' | 'offline' | undefined;

  serverList = [{ label: 'Гелиос', value: 'Гелиос' }];

  constructor() {
    this.initCurrentServer();
  }

  ngOnInit(): void {
    this.getCurrentUser();

    this.isOnlineSubscription = this.websocketService.isOnline$.subscribe(
      (res: any) => {
        if (res) {
          console.log('isOnline', res);
          if (this.storageService.getLocalStorage('email') === res.email) {
            this.isOnline = res.status;
          }
        }
      },
    );

    this.isOnlineSubscription = this.websocketService.onlineUserList$.subscribe(
      (res: any) => {
        if (res) {
          console.log('onlineUserList', res);
        }
      },
    );

    this.router.events.subscribe(() => {
      this.updateRoute();
    });
    this.updateRoute();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(this.tokenRefreshTimeout);
        this.checkAndRefreshToken();
      }
    });

    this.checkAndRefreshToken();
  }

  ngOnDestroy(): void {
    if (this.isOnlineSubscription) {
      this.isOnlineSubscription.unsubscribe();
    }

    this.websocketService.disconnect();
    clearTimeout(this.tokenRefreshTimeout);
  }

  private connectWebSocket(): void {
    const accessToken = this.storageService.getLocalStorage('token');
    const email = this.storageService.getLocalStorage('email');

    console.log('email', email);

    if (accessToken && email) {
      console.log('connect', accessToken);
      this.websocketService.connect(accessToken, email);
    }
  }

  private checkAndRefreshToken(): void {
    const accessToken = this.storageService.getLocalStorage('token');

    if (accessToken) {
      const decodedToken = jwtDecode(accessToken) as { exp: number };
      const isExpired = decodedToken.exp * 1000 < Date.now();

      if (isExpired) {
        this.exchangeRefresh(() => {
          this.websocketService.disconnect();
          console.log('disconnected', moment(Date.now()).format('HH:mm:ss'));

          this.connectWebSocket();
        });
      } else {
        this.scheduleTokenRefresh(decodedToken.exp);
      }
    }
  }

  private initCurrentServer() {
    this.currentServer =
      this.storageService.getLocalStorage('server') || 'Гелиос';
  }

  private sortTimerList(timerList: TimerItem[]): void {
    this.timerList = timerList.sort((a, b) => {
      if (!a.mobData.respawnTime) return 1;
      if (!b.mobData.respawnTime) return -1;

      return a.mobData.respawnTime - b.mobData.respawnTime;
    });
  }

  private scheduleTokenRefresh(expirationTime: number): void {
    const refreshTime = expirationTime * 1000 - Date.now() - 60 * 1000;

    this.tokenRefreshTimeout = setTimeout(() => {
      this.checkAndRefreshToken();
    }, refreshTime);
  }

  private exchangeRefresh(callback: Function) {
    this.tokenService.refreshToken().subscribe({
      next: (res) => {
        console.log('Токен обновлён', res);
        if (callback && typeof callback === 'function') {
          callback();
        }
      },
      error: (err) => {
        console.log('Ошибка при обновлении токена', err);
        if (err.status === 401) {
          this.onLogout();
        }
      },
    });
  }

  updateCurrentServer() {
    console.log(this.currentServer);
    this.historyService.isLoading = true;
    this.timerService.isLoading = true;
    this.storageService.setCurrentServer(this.currentServer);
    this.updateAllBosses();
  }

  updateAllBosses(): void {
    this.timerService.getAllBosses(this.currentServer).subscribe({
      next: (res) => {
        this.sortTimerList([...res]);

        this.timerService.timerList = this.timerList;

        this.timerList.forEach((item) => {
          item.mob.plusCooldown = 0;
        });
        this.timerService.isLoading = false;
        // this.updateHistory();
      },
      error: (err) => {
        this.messageService.create('error', err.error.message);
      },
    });
  }

  // updateHistory(): void {
  //   this.historyService.getHistory(this.currentServer).subscribe({
  //     next: (res: any) => {
  //       this.historyListData = res;
  //       this.historyList = res.data;
  //       this.historyService.historyList = this.historyList;
  //       this.historyService.historyListData = this.historyListData;
  //       this.historyService.isLoading = false;
  //     },
  //     error: (err) => {
  //       if (err.status === 401) {
  //         this.exchangeRefresh(() => {
  //           this.updateHistory();
  //         });
  //       }
  //     },
  //   });
  // }

  getCurrentUser() {
    this.userService.getUser().subscribe({
      next: (res) => {
        this.userService.currentUser = res;
        this.storageService.setLocalStorage(
          res.email,
          this.storageService.getLocalStorage('token'),
        );
        this.connectWebSocket();
      },
      error: (err) => {
        this.messageService.create('error', err.error.message);
      },
    });
  }

  copyRespText() {
    let data: string[] = [];
    console.log('object', this.timerList);
    this.initCurrentServer();
    this.timerService.getAllBosses(this.currentServer).subscribe({
      next: (res) => {
        this.sortTimerList([...res]);

        this.timerList.forEach((item) => {
          item.mob.plusCooldown = 0;
          if (item.mobData.respawnTime) {
            data.push(
              `${item.mob.shortName} - ${moment(
                item.mobData.respawnTime,
              ).format('HH:mm:ss')}`,
            );
          }
        });
        this.messageService.create('success', 'Респы были успешно скопированы');
        navigator.clipboard.writeText(data.join(',\n'));
      },
      error: (err) => {
        this.messageService.create('error', err.error.message);
      },
    });
  }

  showCrashServerModal() {
    this.modalService.confirm({
      nzTitle: 'Внимание',
      nzContent:
        '<b>Вы точно хотите переписать все респы с учётом падения сервера?</b>',
      nzOkText: 'Да',
      nzOnOk: () => this.onCrashServer(),
      nzCancelText: 'Нет',
      nzOnCancel: () => console.log('Cancel'),
    });
  }

  onCrashServer() {
    this.initCurrentServer();
    this.timerService.isLoading = true;
    console.log(this.currentServer);
    this.timerService.crashServerBosses(this.currentServer).subscribe({
      next: () => {
        this.updateAllBosses();
        this.messageService.create(
          'success',
          'Респы теперь с учётом падения сервера',
        );
      },
      error: (err) => {
        this.messageService.create('error', err.error.message);
      },
    });
  }

  isLoggedIn(): boolean {
    return this.storageService.isLoggedIn();
  }

  onLogin(): void {
    this.router.navigate(['/login']);
  }

  showLogoutModal(): void {
    this.modalService.confirm({
      nzTitle: 'Внимание',
      nzContent: '<b>Вы точно хотите выйти?</b>',
      nzOkText: 'Да',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onLogout(),
      nzCancelText: 'Нет',
      nzOnCancel: () => console.log('Cancel'),
    });
  }

  onLogout(): void {
    this.authService.signOut().subscribe({
      next: () => {
        this.timerService.headerVisibility = false;
        this.websocketService.disconnect();
        this.storageService.clean();
        this.onLogin();
      },
    });
  }

  onHistory(): void {
    this.historyService.isLoading = true;
    this.router.navigate(['/history']);
  }

  onTimer(): void {
    this.timerService.isLoading = true;
    this.router.navigate(['/timer']);
  }

  onProfile(): void {
    this.router.navigate(['/profile']);
  }

  updateRoute(): void {
    this.currentRoute = this.router.url;
  }
}
