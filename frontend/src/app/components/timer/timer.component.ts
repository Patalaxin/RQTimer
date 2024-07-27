import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BehaviorSubject } from 'rxjs';
import { TimerItem } from 'src/app/interfaces/timer-item';
import { AuthService } from 'src/app/services/auth.service';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy {
  timerList: TimerItem[] = [];
  isLoading = this.timerService.isLoading;
  currentServer: string = '';
  leftTime: number = 0;
  currentTime: number = Date.now();
  currentItem: any;

  percent: number = 0;
  intervalId: any;

  isVisible: boolean = false;
  isOkLoading: boolean = false;

  cooldownChangeVisible: boolean = false;

  isScreenWidth1000: boolean = false;
  isScreenWidth750: boolean = false;
  isScreenWidth372: boolean = false;
  isScreenWidthInZone: boolean = false;

  constructor(
    private timerService: TimerService,
    private storageService: StorageService,
    private authService: AuthService,
    private message: NzMessageService
  ) {
    console.log(this.isLoading);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenWidth();
  }

  private checkScreenWidth(): void {
    this.isScreenWidth1000 = window.innerWidth <= 1000;
    this.isScreenWidth750 = window.innerWidth <= 750;
    this.isScreenWidthInZone =
      window.innerWidth <= 750 && window.innerWidth > 372;
    this.isScreenWidth372 = window.innerWidth <= 372;
  }

  updatePercent(item: TimerItem): number {
    if (
      item.mobData.respawnTime &&
      item.mobData.deathTime &&
      this.currentTime < item.mobData.respawnTime
    ) {
      return (
        ((this.currentTime - item.mobData.deathTime) /
          (item.mobData.respawnTime - item.mobData.deathTime)) *
        100
      );
    }

    return 100;
  }

  onClickTimerItem(item: TimerItem): void {
    let data: string = `${item.mob.shortName} - ${moment(
      item.mobData.respawnTime
    ).format('HH:mm:ss')}`;
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
    this.timerService.setIsLoading(true);
    console.log('confirm', this.currentItem);
    this.currentTime = Date.now();
    this.timerService
      .setByDeathTime(this.currentItem, moment(this.currentTime).valueOf())
      .subscribe({
        next: (res) => {
          this.getAllBosses(1);
          this.isVisible = false;
          this.isOkLoading = false;
          this.message.create(
            'success',
            'Респ был успешно обновлён по точному времени смерти'
          );
        },
      });
  }

  onDieNow(item: TimerItem): void {
    this.timerService.setIsLoading(true);
    this.currentTime = Date.now();
    console.log('onDieNow', item);
    this.timerService
      .setByDeathTime(item, moment(this.currentTime).valueOf() - 10000)
      .subscribe({
        next: (res) => {
          this.getAllBosses(1);
          this.message.create(
            'success',
            'Респ был успешно переписан кнопкой "Упал сейчас"'
          );
        },
      });
  }

  onPlusCooldown(item: TimerItem): void {
    item.mob.plusCooldown++;
    if (item.mobData.respawnTime) {
      item.mobData.respawnTime += item.mob.cooldownTime;
    }
  }

  onSetByCooldownTime(item: TimerItem): void {
    this.timerService.setIsLoading(true);
    this.timerService.setByCooldownTime(item).subscribe({
      next: (res) => {
        this.getAllBosses(1);
        this.message.create('success', 'Респ был успешно переписан по кд');
      },
    });
  }

  onLostCooldown(item: TimerItem): void {
    this.timerService.setIsLoading(true);
    console.log('onDieNow', item);
    this.timerService.respawnLost(item).subscribe({
      next: (res) => {
        this.getAllBosses(1);
      },
    });
  }

  getAllBosses(retryCount: number): void {
    this.currentServer = this.storageService.getSessionStorage('server');
    console.log(this.currentServer);
    this.timerService.getAllBosses(this.currentServer).subscribe({
      next: (res) => {
        console.log(res);
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
        });
        this.timerService.setIsLoading(false);
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
    this.intervalId = setInterval(() => {
      this.currentTime = Date.now();
    }, 1000);

    this.checkScreenWidth();
    this.getAllBosses(1);
    this.timerService.timerList.subscribe({
      next: (res) => {
        this.timerList = res;
        console.log('timer', this.timerList);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
