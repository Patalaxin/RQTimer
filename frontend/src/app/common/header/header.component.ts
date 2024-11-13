import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subscription } from 'rxjs';
import { TimerItem } from 'src/app/interfaces/timer-item';
import { AuthService } from 'src/app/services/auth.service';
// import { ConfigurationService } from 'src/app/services/configuration.service';
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
  // private readonly configurationService = inject(ConfigurationService);
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
  isOnline: 'online' | 'offline' = 'offline';

  serverList = [
    { label: 'Гелиос', value: 'Гелиос' },
    { label: 'Игнис', value: 'Игнис' },
  ];
  // serverList: any[] = [];

  duplicatedMobList: any = [
    'Альфа Самец',
    'Богатый Упырь',
    'Кабан Вожак',
    'Слепоглаз',
    'Хозяин',
  ];

  constructor() {
    this.initCurrentServer();
  }

  ngOnInit(): void {
    this.getCurrentUser();

    this.isOnlineSubscription = this.websocketService.isOnline$.subscribe(
      (res: any) => {
        if (res) {
          if (this.storageService.getLocalStorage('email') === res.email) {
            this.isOnline = res.status;
          }
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

    if (accessToken && email) {
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
          this.connectWebSocket();
        });
      } else {
        this.scheduleTokenRefresh(decodedToken.exp);
      }
    }
  }

  private initCurrentServer() {
    // this.configurationService.getServers().subscribe({
    //   next: (res) => {
    //     console.log('servers', res);
    //     res.map((item: string) => {
    //       let server = { label: item, value: item };
    //       this.serverList.push(server);
    //     });
    //     console.log(this.serverList);
    this.currentServer =
      this.storageService.getLocalStorage('server') || 'Гелиос';
    // },
    // });
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
        if (callback && typeof callback === 'function') {
          callback();
        }
      },
      error: (err) => {
        if (err.status === 401) {
          this.onLogout();
        }

        if ((err.status >= 500 && err.status < 600) || err.status === 0) {
          this.messageService.create(
            'error',
            'Ошибка обращения к сервису. Поробуйте обновить страницу',
          );
        }
      },
    });
  }

  updateCurrentServer() {
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
    });
  }

  copyRespText() {
    let data: string[] = [];
    this.initCurrentServer();
    this.timerService.getAllBosses(this.currentServer).subscribe({
      next: (res) => {
        this.sortTimerList([...res]);

        this.timerList.forEach((item) => {
          item.mob.plusCooldown = 0;
          if (item.mobData.respawnTime) {
            data.push(
              `${this.duplicatedMobList.includes(item.mob.mobName) ? `${item.mob.shortName}: ${item.mob.location}` : item.mob.shortName} - ${moment(
                item.mobData.respawnTime,
              ).format('HH:mm:ss')}`,
            );
          }
        });
        this.messageService.create('success', 'Респы были успешно скопированы');
        navigator.clipboard.writeText(data.join(',\n'));
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
    this.timerService.crashServerBosses(this.currentServer).subscribe({
      next: () => {
        this.updateAllBosses();
        this.messageService.create(
          'success',
          'Респы теперь с учётом падения сервера',
        );
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
