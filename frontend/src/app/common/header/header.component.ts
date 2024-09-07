import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subscription } from 'rxjs';
import { TimerItem } from 'src/app/interfaces/timer-item';
import { AuthService } from 'src/app/services/auth.service';
import { HistoryService } from 'src/app/services/history.service';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';
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
  private readonly historyService = inject(HistoryService);
  private readonly authService = inject(AuthService);
  private readonly websocketService = inject(WebsocketService);
  private readonly modalService = inject(NzModalService);
  private readonly messageService = inject(NzMessageService);

  currentServer: string = 'Гранас';
  currentRoute: string = '';
  timerList: TimerItem[] = [];
  historyListData: any = [];
  historyList: any = [];

  isOnlineSubscription: Subscription | undefined;
  isOnline: 'online' | 'offline' | undefined;

  serverList = [
    { label: 'Гранас', value: 'Гранас' },
    { label: 'Энигма', value: 'Энигма' },
    { label: 'Логрус', value: 'Логрус' },
  ];

  constructor() {
    this.initCurrentServer();
  }

  ngOnInit(): void {
    if (this.storageService.getLocalStorage('token')) {
      this.websocketService.connect(
        this.storageService.getLocalStorage('token'),
        this.storageService.getLocalStorage('email'),
      );
    }

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
  }

  ngOnDestroy(): void {
    if (this.isOnlineSubscription) {
      this.isOnlineSubscription.unsubscribe();
    }

    this.websocketService.disconnect();
  }

  private initCurrentServer() {
    this.currentServer =
      this.storageService.getLocalStorage('server') || 'Гранас';
  }

  private sortTimerList(timerList: TimerItem[]): void {
    this.timerList = timerList.sort((a, b) => {
      if (!a.mobData.respawnTime) return 1;
      if (!b.mobData.respawnTime) return -1;

      return a.mobData.respawnTime - b.mobData.respawnTime;
    });
  }

  updateCurrentServer() {
    console.log(this.currentServer);
    this.historyService.isLoading = true;
    this.timerService.isLoading = true;
    this.storageService.setCurrentServer(this.currentServer);
    this.updateHistory();
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
