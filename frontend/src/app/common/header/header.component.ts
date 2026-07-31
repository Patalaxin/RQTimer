import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { jwtDecode } from 'jwt-decode';
import * as momentTimezone from 'moment-timezone';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ITimerItem } from 'src/app/interfaces/timer-item';
import { IUser } from 'src/app/interfaces/user';
import { IUserOnlineStatus } from 'src/app/interfaces/websocket';
import {
  IHistoryEntry,
  IPaginatedHistory,
} from 'src/app/interfaces/history-entry';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
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

  usersCount: number | null = null;

  currentServer: string = 'Helios';
  currentRoute: string = '';
  timerList: ITimerItem[] = [];
  historyListData: IPaginatedHistory | null = null;
  historyList: IHistoryEntry[] = [];
  tokenRefreshTimeout: ReturnType<typeof setTimeout> | undefined;
  currentUser: IUser | null = null;

  timerSearchValue: string = '';

  isOnlineSubscription: Subscription | undefined;
  groupNameSubscription: Subscription | undefined;
  timerListSubscription: Subscription | undefined;
  excludedMobsSubscription: Subscription | undefined;
  isOnline: 'online' | 'offline' = 'offline';

  private readonly destroy$ = new Subject<void>();
  private readonly onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      clearTimeout(this.tokenRefreshTimeout);
      this.checkAndRefreshToken();
    }
  };

  serverList: { label: string; value: string }[] = [];

  excludedMobs: string[] = [];

  isScreenWidth700: boolean = false;

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
    this.getUsersCount();

    this.timerListSubscription = this.timerService.timerList$.subscribe({
      next: (res) => {
        this.timerList = res;
        this.cdr.markForCheck();
      },
    });

    this.isOnlineSubscription = this.websocketService.isOnline$.subscribe(
      (res: IUserOnlineStatus | null) => {
        if (res) {
          if (this.storageService.getLocalStorage('email') === res.email) {
            this.isOnline = res.status;
            this.cdr.markForCheck();
          }
        }
      },
    );

    this.excludedMobsSubscription = this.userService.excludedMobs$.subscribe({
      next: (excludedMobs) => {
        this.excludedMobs = excludedMobs;
        this.cdr.markForCheck();
      },
    });

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateRoute();
      this.cdr.markForCheck();
    });
    this.updateRoute();

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    if (this.isOnlineSubscription) {
      this.isOnlineSubscription.unsubscribe();
    }
    if (this.groupNameSubscription) {
      this.groupNameSubscription.unsubscribe();
    }
    if (this.timerListSubscription) {
      this.timerListSubscription.unsubscribe();
    }
    if (this.excludedMobsSubscription) {
      this.excludedMobsSubscription.unsubscribe();
    }

    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.destroy$.next();
    this.destroy$.complete();

    this.websocketService.disconnect();
    clearTimeout(this.tokenRefreshTimeout);
  }

  private checkScreenWidth(): void {
    this.isScreenWidth700 = window.innerWidth <= 700;
    const left = document.querySelector('.header-left');
    const right = document.querySelector('.header-right');

    if (!this.isScreenWidth700) {
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
          this.storageService.getLocalStorage('server') || 'Helios';
        this.cdr.markForCheck();
      },
    });
  }

  private sortTimerList(timerList: ITimerItem[]): void {
    this.timerList = this.timerService.sortByRespawnTime(timerList);
  }

  private scheduleTokenRefresh(expirationTime: number): void {
    const refreshTime = expirationTime * 1000 - Date.now() - 60 * 1000;

    this.tokenRefreshTimeout = setTimeout(() => {
      this.checkAndRefreshToken();
    }, refreshTime);
  }

  private exchangeRefresh(callback: Function) {
    this.tokenService.refreshToken().subscribe({
      next: () => {
        if (callback && typeof callback === 'function') {
          callback();
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.onLogout();
        }
      },
    });
  }

  private getUsersCount(): void {
    this.userService.getUsersCount().subscribe({
      next: (res) => {
        this.usersCount = res.count;
        this.cdr.markForCheck();
      },
    });
  }

  bindingHotkey(): void {
    this.bindingService.clickReloadButton$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateCurrentServer();
      });

    this.bindingService.clickCopyButton$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.copyRespText();
      });

    this.bindingService.focusSearchInput$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
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
    this.timerSearch(this.timerSearchValue);
    this.historyService.isLoading = true;
    this.timerService.isLoading = true;
    this.storageService.setCurrentServer(this.currentServer);
    this.updateAllBosses();
  }

  updateAllBosses(): void {
    const lang = localStorage.getItem('language') || 'ru';
    this.timerService.getAllBosses(this.currentServer, lang).subscribe({
      next: (res) => {
        const filteredRes = this.timerService.filterExcludedMobs(
          res,
          this.userService.currentExcludedMobs,
        );
        this.sortTimerList([...filteredRes]);

        this.timerService.timerList = this.timerList;
        this.timerService.filteredTimerList = this.timerList;

        this.timerList.forEach((item) => {
          item.mob.plusCooldown = 0;
        });
        this.timerService.isLoading = false;

        if (this.groupNameSubscription) {
          this.groupNameSubscription.unsubscribe();
        }

        this.groupNameSubscription = this.timerService.groupName$.subscribe({
          next: (res) => {
            if (res) {
              this.updateHistory();
            }
            this.cdr.markForCheck();
          },
        });

        this.cdr.markForCheck();
      },
      error: () => {
        this.timerService.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  updateHistory(): void {
    const lang = localStorage.getItem('language') || 'ru';
    this.historyService
      .getHistory(this.currentServer, undefined, undefined, lang)
      .subscribe({
        next: (res) => {
          this.historyListData = res;
          this.historyList = res.data;
          this.historyService.historyList = this.historyList;
          this.historyService.historyListData = this.historyListData;
          this.historyService.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.historyService.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  getCurrentUser() {
    let accessToken;
    let userTimezone = momentTimezone.tz.guess();

    this.userService.getUser().subscribe({
      next: (res) => {
        this.userService.currentUser = res;
        this.excludedMobs = res.excludedMobs || [];
        this.userService.excludedMobs = this.excludedMobs;
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
        this.cdr.markForCheck();
      },
    });
  }

  copyRespText() {
    let data: string[] = [];
    this.initCurrentServer();
    const lang = localStorage.getItem('language') || 'ru';
    this.timerService.getAllBosses(this.currentServer, lang).subscribe({
      next: (res) => {
        const filteredRes = this.timerService.filterExcludedMobs(
          res,
          this.userService.currentExcludedMobs,
        );

        this.sortTimerList([...filteredRes]);

        this.timerList.forEach((item) => {
          item.mob.plusCooldown = 0;
          if (item.mobData.respawnTime) {
            data.push(
              `${this.timerService.duplicatedMobList.includes(item.mobData.mobId) ? `${item.mob.shortName}: ${item.mob.location}` : item.mob.shortName} - ${moment(
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
        this.cdr.markForCheck();
      },
    });
  }

  showCrashServerModal() {
    const lang = localStorage.getItem('language') || 'ru';
    const title = this.translateService.instant(
      'HEADER.MODAL.SERVER_CRASH_TITLE',
    );
    const mainMessage = this.translateService.instant(
      'HEADER.MODAL.SERVER_CRASH_MESSAGE',
    );
    const loadingText = this.translateService.instant('COMMON.LOADING');

    const titleHtml = `
      <h3>${title}</h3>
    `;

    const loadingHtml = `
      <div class="server-crash-info">
        <div class="server-crash-loader">
          <span class="loader-spinner"></span>
          <span>${loadingText}</span>
        </div>
      </div>
    `;

    const mainHtml = `
      <span class="server-crash-main">${mainMessage}</span>
    `;

    const modalRef: NzModalRef = this.modalService.create({
      nzContent: `${titleHtml}${loadingHtml}${mainHtml}`,
      nzOkText: this.translateService.instant('COMMON.BUTTONS.YES'),
      nzOkType: 'primary',
      nzOnOk: () => this.onCrashServer(),
      nzCancelText: this.translateService.instant('COMMON.BUTTONS.NO'),
      nzClosable: true,
      nzWidth: 520,
      nzOkDisabled: true,
    });

    setTimeout(() => {
      const modalElement = document.querySelector(
        '.ant-modal-wrap:last-child .ant-modal',
      );
      if (modalElement) {
        modalElement.classList.add('ant-modal-confirm');
      }
    }, 0);

    this.historyService
      .getHistory(
        this.currentServer,
        undefined,
        undefined,
        lang,
        'crashMobServer',
      )
      .subscribe({
        next: (res) => {
          let crashInfoHtml = '';

          if (
            res.data &&
            res.data[0] &&
            Date.now() - res.data[0].date < 1800000
          ) {
            const crashData = res.data[0];
            const formattedDate = moment(crashData.date).format('HH:mm:ss');
            const crashInfoText = this.translateService.instant(
              'HEADER.MODAL.SERVER_CRASH_INFO',
              {
                nickname: crashData.nickname,
                date: formattedDate,
              },
            );

            crashInfoHtml = `
              <div class="server-crash-info server-crash-info-data">
                ${crashInfoText}
              </div>
            `;
          } else {
            const noDataText = this.translateService.instant(
              'HEADER.MODAL.SERVER_CRASH_NO_DATA',
            );
            crashInfoHtml = `
              <div class="server-crash-info server-crash-info-no-data">
                ${noDataText}
              </div>
            `;
          }

          modalRef.updateConfig({
            nzContent: `${titleHtml}${crashInfoHtml}${mainHtml}`,
            nzOkDisabled: false,
          });
        },
        error: () => {
          const noDataText = this.translateService.instant(
            'HEADER.MESSAGE.REQUEST_FAILED_CHECK_CONNECTION',
          );
          const crashInfoHtml = `
            <div class="server-crash-info">
              ${noDataText}
            </div>
          `;
          modalRef.updateConfig({
            nzContent: `${titleHtml}${crashInfoHtml}${mainHtml}`,
            nzOkDisabled: false,
          });
        },
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

  timerSearch(value: string): void {
    this.timerService.filteredTimerList = value
      ? this.timerList.filter((item) =>
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
    this.authService.logout();
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
