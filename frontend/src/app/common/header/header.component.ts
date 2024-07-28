import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TimerItem } from 'src/app/interfaces/timer-item';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  currentServer: string = 'Гранас';
  timerList: TimerItem[] = [];

  serverList = [
    { label: 'Гранас', value: 'Гранас' },
    { label: 'Энигма', value: 'Энигма' },
    { label: 'Логрус', value: 'Логрус' },
  ];

  constructor(
    private router: Router,
    private storageService: StorageService,
    private timerService: TimerService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {}

  setCurrentServer() {
    console.log(this.currentServer);
    this.timerService.setIsLoading(true);
    this.storageService.setCurrentServer(this.currentServer);
    this.timerService.getAllBosses(this.currentServer).subscribe({
      next: (res) => {
        this.timerList = [...res];
        this.timerList = this.timerList.sort((a, b) => {
          if (a.mobData.respawnLost && a.mobData.respawnLost == true) return 1;
          if (b.mobData.respawnLost && b.mobData.respawnLost == true) return -1;

          if (a.mobData.respawnTime && b.mobData.respawnTime) {
            return a.mobData.respawnTime > b.mobData.respawnTime ? 1 : -1;
          }

          return 0;
        });

        this.timerService.setTimerList(this.timerList);

        this.timerList.map((item) => {
          item.mob.plusCooldown = 0;
        });
        this.timerService.setIsLoading(false);
      },
    });
  }

  getCurrentServer() {
    this.currentServer = this.storageService.getSessionStorage('server');
  }

  copyRespText() {
    let data: string[] = [];
    console.log('object', this.timerList);
    this.getCurrentServer();
    this.timerService.getAllBosses(this.currentServer).subscribe({
      next: (res) => {
        this.timerList = [...res];
        this.timerList = this.timerList.sort((a, b) => {
          if (a.mobData.respawnLost && a.mobData.respawnLost == true) return 1;
          if (b.mobData.respawnLost && b.mobData.respawnLost == true) return -1;

          if (a.mobData.respawnTime && b.mobData.respawnTime) {
            return a.mobData.respawnTime > b.mobData.respawnTime ? 1 : -1;
          }

          return 0;
        });
        this.timerList.map((item) => {
          item.mob.plusCooldown = 0;
          if (item.mobData.respawnTime) {
            data.push(
              `${item.mob.shortName} - ${moment(
                item.mobData.respawnTime
              ).format('HH:mm:ss')}`
            );
          }
        });
        this.message.create('success', 'Респы были успешно скопированы');
        navigator.clipboard.writeText(data.join(',\n'));
      },
    });
  }

  onCrashServer() {
    this.getCurrentServer();
    console.log(this.currentServer);
    this.timerService.crashServerBosses(this.currentServer).subscribe({
      next: (res) => {
        this.setCurrentServer();
        this.message.create('success', 'Респы теперь с учётом падения сервера');
      },
    });
  }

  isLoggedIn(): boolean {
    return this.storageService.isLoggedIn();
  }

  onRegister(): void {
    this.router.navigate(['/register']);
  }

  onLogin(): void {
    this.router.navigate(['/login']);
  }

  showLogoutModal(): void {
    this.modal.confirm({
      nzTitle: 'Внимание',
      nzContent: '<b style="color: red;">Вы точно хотите выйти?</b>',
      nzOkText: 'Да',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onLogout(),
      nzCancelText: 'Нет',
      nzOnCancel: () => console.log('Cancel'),
    });
  }

  onLogout(): void {
    this.storageService.clean();
    this.onLogin();
  }

  onTimer(): void {
    this.router.navigate(['/timer']);
  }

  onProfile(): void {
    this.router.navigate(['/profile']);
  }

  ngOnInit(): void {
    this.getCurrentServer();
  }
}
