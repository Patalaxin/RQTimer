import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
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
  private readonly translateService = inject(TranslateService);

  currentServer: string = 'Гелиос';
  currentRoute: string = '';
  timerList: TimerItem[] = [];
  historyListData: any = [];
  historyList: any = [];
  tokenRefreshTimeout: any;
  currentUser: any = [];

  timerSearchValue: string = '';

  isOnlineSubscription: Subscription | undefined;
  isOnline: 'online' | 'offline' = 'offline';

  serverList = [
    { label: 'Гелиос', value: 'Гелиос' },
    { label: 'Игнис', value: 'Игнис' },
    { label: 'Astus', value: 'Astus' },
    { label: 'Pyros', value: 'Pyros' },
    { label: 'Aztec', value: 'Aztec' },
    { label: 'Ortos', value: 'Ortos' },
  ];
  // serverList: any[] = [];

  duplicatedMobList: any = [
    'Альфа Самец',
    'Богатый Упырь',
    'Кабан Вожак',
    'Слепоглаз',
    'Хозяин',
  ];

  isScreenWidth600: boolean = false;

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenWidth();
  }

  constructor() {
    this.initCurrentServer();
  }

  ngOnInit(): void {
    this.checkScreenWidth();
    this.getCurrentUser();

    this.timerService.timerList$.subscribe({
      next: (res) => {
        this.timerList = res;
      },
    });

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
  }

  ngOnDestroy(): void {
    if (this.isOnlineSubscription) {
      this.isOnlineSubscription.unsubscribe();
    }

    this.websocketService.disconnect();
    clearTimeout(this.tokenRefreshTimeout);
  }

  private checkScreenWidth(): void {
    this.isScreenWidth600 = window.innerWidth <= 600;
    const left = document.querySelector('.header-left');
    const right = document.querySelector('.header-right');

    if (!this.isScreenWidth600) {
      left?.classList.remove('header-d-none');
      right?.classList.remove('header-d-none');
    }
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
    //     res.map((item: string) => {
    //       let server = { label: item, value: item };
    //       this.serverList.push(server);
    //     });
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
      },
    });
  }

  onSearchOpen(): void {
    const search = document.querySelector('.header-search');
    const left = document.querySelector('.header-left');
    const right = document.querySelector('.header-right');

    search?.classList.remove('header-d-none');
    left?.classList.remove('header-d-inline');
    right?.classList.remove('header-d-inline');

    search?.classList.add('header-d-flex');
    left?.classList.add('header-d-none');
    right?.classList.add('header-d-none');
  }

  onSearchClose(): void {
    const search = document.querySelector('.header-search');
    const left = document.querySelector('.header-left');
    const right = document.querySelector('.header-right');

    search?.classList.remove('header-d-flex');
    left?.classList.remove('header-d-none');
    right?.classList.remove('header-d-none');

    search?.classList.add('header-d-none');
    left?.classList.add('header-d-inline');
    right?.classList.add('header-d-inline');

    this.timerSearchValue = '';
    this.timerSearch(this.timerSearchValue);
  }

  updateCurrentServer() {
    this.timerSearchValue = '';
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
        this.timerService.filteredTimerList = this.timerList;

        this.timerList.forEach((item) => {
          item.mob.plusCooldown = 0;
        });
        this.timerService.isLoading = false;
        this.updateHistory();
      },
      error: () => {
        this.timerService.isLoading = false;
      },
    });
  }

  updateHistory(): void {
    this.historyService.getHistory(this.currentServer).subscribe({
      next: (res: any) => {
        this.historyListData = res;
        this.historyList = res.data;
        this.historyService.historyList = this.historyList;
        this.historyService.historyListData = this.historyListData;
        this.historyService.isLoading = false;
      },
      error: () => {
        this.historyService.isLoading = false;
      },
    });
  }

  getCurrentUser() {
    let accessToken;
    let userTimezone = moment.tz.guess();

    this.userService.getUser().subscribe({
      next: (res) => {
        this.userService.currentUser = res;
        this.storageService.setLocalStorage(
          res.email,
          (accessToken = this.storageService.getLocalStorage('token')),
        );

        if (window.localStorage.getItem('timezone')) {
          if (window.localStorage.getItem('timezone') !== userTimezone) {
            window.localStorage.setItem('timezone', userTimezone);
            this.userService.setUserTimezone(userTimezone).subscribe();
          }
        }

        if (!window.localStorage.getItem('timezone')) {
          window.localStorage.setItem('timezone', userTimezone);
          this.userService.setUserTimezone(userTimezone).subscribe();
        }

        this.connectWebSocket();

        const decodedToken = jwtDecode(accessToken) as { exp: number };
        this.scheduleTokenRefresh(decodedToken.exp);
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
        this.messageService.create(
          'success',
          this.translateService.instant(
            'HEADER.MESSAGE.RESPAWNS_COPIED_SUCCESSFULLY',
          ),
        );
        navigator.clipboard.writeText(data.join(',\n'));
      },
    });
  }

  showCrashServerModal() {
    this.modalService.confirm({
      nzTitle: this.translateService.instant('HEADER.MODAL.SERVER_CRASH_TITLE'),
      nzContent: this.translateService.instant(
        'HEADER.MODAL.SERVER_CRASH_MESSAGE',
      ),
      nzOkText: this.translateService.instant('COMMON.BUTTONS.YES'),
      nzOnOk: () => this.onCrashServer(),
      nzCancelText: this.translateService.instant('COMMON.BUTTONS.NO'),
    });
  }

  onCrashServer() {
    this.timerSearchValue = '';
    this.initCurrentServer();
    this.timerService.isLoading = true;
    this.timerService.crashServerBosses(this.currentServer).subscribe({
      next: () => {
        this.updateAllBosses();
        this.messageService.create(
          'success',
          this.translateService.instant(
            'HEADER.MESSAGE.RESPAWNS_WITH_SERVER_CRASH',
          ),
        );
      },
    });
  }

  timerSearch(value: any): void {
    this.timerService.filteredTimerList = value
      ? this.timerList.filter((item: any) =>
          item.mob.mobName.toLowerCase().includes(value.toLowerCase()),
        )
      : [...this.timerList];
  }

  isLoggedIn(): boolean {
    return this.storageService.isLoggedIn();
  }

  onLogin(): void {
    this.router.navigate(['/login']);
  }

  showLogoutModal(): void {
    this.modalService.confirm({
      nzTitle: this.translateService.instant('HEADER.MODAL.LOGOUT_TITLE'),
      nzContent: this.translateService.instant('HEADER.MODAL.LOGOUT_MESSAGE'),
      nzOkText: this.translateService.instant('COMMON.BUTTONS.YES'),
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onLogout(),
      nzCancelText: this.translateService.instant('COMMON.BUTTONS.NO'),
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
