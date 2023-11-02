import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin } from 'rxjs';
import { TimerItem } from 'src/app/interfaces/timer-item';
import { AuthService } from 'src/app/services/auth.service';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit {
  timerList: TimerItem[] = [];
  isLoading: boolean = true;
  currentServer: string = '';
  leftTime: number = 0;
  currentTime: number = Date.now();
  currentItem: any;

  isVisible: boolean = false;
  isOkLoading: boolean = false;

  cooldownChangeVisible: boolean = false;

  constructor(
    private timerService: TimerService,
    private storageService: StorageService,
    private authService: AuthService,
    private message: NzMessageService
  ) {}

  onClickTimerItem(item: TimerItem): void {
    let data: string = `${item.shortName} - ${moment(item.respawnTime).format(
      'HH:mm:ss'
    )}`;
    this.message.create('success', `${data}`);
    navigator.clipboard.writeText(data);
  }

  showDeathModal(item: TimerItem): void {
    this.isVisible = true;
    this.currentItem = item;
  }

  cancelDeathModal(): void {
    this.isVisible = false;
  }

  confirmDeathModal(): void {
    this.isOkLoading = true;
    this.isLoading = true;
    console.log('confirm', this.currentItem);
    this.currentTime = Date.now();
    this.timerService
      .setByDeathTime(this.currentItem, moment(this.currentTime).valueOf())
      .subscribe({
        next: (res) => {
          this.message.create(
            'success',
            'Респ был успешно обновлён по точному времени смерти'
          );
          this.getAllBosses(1);
          this.isVisible = false;
          this.isOkLoading = false;
          this.isLoading = false;
        },
      });
  }

  onDieNow(item: TimerItem): void {
    this.isLoading = true;
    this.currentTime = Date.now();
    console.log('onDieNow', item);
    this.timerService
      .setByDeathTime(item, moment(this.currentTime).valueOf() - 10000)
      .subscribe({
        next: (res) => {
          this.message.create(
            'success',
            'Респ был успешно переписан кнопкой "Упал сейчас"'
          );
          this.getAllBosses(1);
          this.isLoading = false;
        },
      });
  }

  onPlusCooldown(item: TimerItem): void {
    item.plusCooldown++;
    if (item.respawnTime) {
      item.respawnTime += item.cooldownTime;
    }
  }

  onSetByCooldownTime(item: TimerItem): void {
    this.isLoading = true;
    this.timerService.setByCooldownTime(item).subscribe({
      next: (res) => {
        this.message.create('success', 'Респ был успешно переписан по кд');
        this.getAllBosses(1);
        this.isLoading = false;
      },
    });
  }

  onLostCooldown(item: TimerItem): void {
    this.isLoading = true;
    console.log('onDieNow', item);
    this.timerService.setByRespawnTime(item, 0).subscribe({
      next: (res) => {
        this.getAllBosses(1);
        this.isLoading = false;
      },
    });
  }

  getAllBosses(retryCount: number): void {
    this.currentServer = this.storageService.getSessionStorage('server');
    console.log(this.currentServer);
    forkJoin(
      this.timerService.getAllBosses(this.currentServer),
      this.timerService.getAllElites(this.currentServer)
    ).subscribe({
      next: (res) => {
        console.log(res);
        this.timerList = [...res[0], ...res[1]];
        this.timerList = this.timerList.sort((a, b) =>
          a.respawnTime && b.respawnTime && a.respawnTime > b.respawnTime
            ? 1
            : -1
        );

        this.timerList.map((item) => {
          item.plusCooldown = 0;
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.log('getUser error', err);
        if (err.status === 401) {
          if (retryCount > 0) {
            this.exchangeRefresh();
            this.getAllBosses(--retryCount);
          }
        }
      },
    });
  }

  private exchangeRefresh() {
    let key =
      Object.keys(this.storageService.getSessionStorage('email')).length === 0
        ? this.storageService.getSessionStorage('nickname')
        : this.storageService.getSessionStorage('email');
    this.authService.exchangeRefresh(key).subscribe({
      next: (res) => {
        console.log('exchangeRefresh', res);
        this.storageService.setSessionStorage(key, res.accessToken);
      },
    });
  }

  ngOnInit(): void {
    this.getAllBosses(1);
    this.timerService.timerList.subscribe({
      next: (res) => {
        this.timerList = res;
        console.log('timer', this.timerList);
      },
    });
  }
}
