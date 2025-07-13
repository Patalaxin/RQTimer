import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
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
import { BindingService } from 'src/app/services/binding.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
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
  private readonly configurationService = inject(ConfigurationService);
  private readonly userService = inject(UserService);
  private readonly websocketService = inject(WebsocketService);
  private readonly modalService = inject(NzModalService);
  private readonly messageService = inject(NzMessageService);
  private readonly translateService = inject(TranslateService);
  private readonly bindingService = inject(BindingService);

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

  // serverList = [
  //   { label: 'Гелиос', value: 'Гелиос' },
  //   { label: 'Игнис', value: 'Игнис' },
  //   { label: 'Astus', value: 'Astus' },
  //   { label: 'Pyros', value: 'Pyros' },
  //   { label: 'Aztec', value: 'Aztec' },
  //   { label: 'Ortos', value: 'Ortos' },
  // ];
  serverList: any[] = [];

  duplicatedMobList: any = [
    '673a9b38697139657bf024ad',
    '673a9b3f697139657bf024b5',
    '673a9b46697139657bf024b9',
    '673a9b4e697139657bf024bd',
    '67314c701e738aba75ba3484',
    '67314c5f1e738aba75ba3480',
    '67314c511e738aba75ba347c',
    '67314d111e738aba75ba3488',
    '67314d191e738aba75ba348c',
    '67314d431e738aba75ba3490',
    '67314e2d1e738aba75ba349e',
    '67314e341e738aba75ba34a2',
    '673151961e738aba75ba34ce',
    '6731519c1e738aba75ba34d2',
    '673152a61e738aba75ba34e8',
    '673152aa1e738aba75ba34ec',
  ];

  isScreenWidth600: boolean = false;

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenWidth();
  }

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor() {
    this.initCurrentServer();
  }

  ngOnInit(): void {
    this.checkScreenWidth();
    this.getCurrentUser();
    this.bindingHotkey();

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
    this.configurationService.getServers().subscribe({
      next: (res) => {
        this.serverList = res.map((item: string) => ({
          label: item,
          value: item,
        }));
        this.currentServer =
          this.storageService.getLocalStorage('server') || 'Гелиос';
      },
    });
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

  bindingHotkey(): void {
    this.bindingService.clickReloadButton$.subscribe(() => {
      this.updateCurrentServer();
    });

    this.bindingService.clickCopyButton$.subscribe(() => {
      this.copyRespText();
    });

    this.bindingService.focusSearchInput$.subscribe(() => {
      this.searchInput.nativeElement.focus();
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
    const lang = localStorage.getItem('language') || 'ru';
    this.timerService.getAllBosses(this.currentServer, lang).subscribe({
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
    const lang = localStorage.getItem('language') || 'ru';
    this.historyService
      .getHistory(this.currentServer, undefined, undefined, lang)
      .subscribe({
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
    const lang = localStorage.getItem('language') || 'ru';
    this.timerService.getAllBosses(this.currentServer, lang).subscribe({
      next: (res) => {
        this.sortTimerList([...res]);

        this.timerList.forEach((item) => {
          item.mob.plusCooldown = 0;
          if (item.mobData.respawnTime) {
            data.push(
              `${this.duplicatedMobList.includes(item.mobData.mobId) ? `${item.mob.shortName}: ${item.mob.location}` : item.mob.shortName} - ${moment(
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
