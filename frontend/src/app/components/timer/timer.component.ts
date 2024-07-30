import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BehaviorSubject } from 'rxjs';
import { TimerItem } from 'src/app/interfaces/timer-item';
import { AuthService } from 'src/app/services/auth.service';
import { HistoryService } from 'src/app/services/history.service';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy {
  timerList: TimerItem[] = [];
  historyList: any = [];
  historyListData: any = [];
  isLoading = this.timerService.isLoading;
  isHistoryLoading = this.historyService.isLoading;
  currentServer: string = '';
  leftTime: number = 0;

  radioValue: string = 'A';
  currentTime: number = Date.now();
  currentProgressTime: number = Date.now();
  currentItem: any;
  cooldown: number = 1;

  percent: number = 0;
  intervalId: any;

  cooldownChangeVisible: boolean = false;

  isScreenWidth1000: boolean = false;
  isScreenWidth750: boolean = false;
  isScreenWidth372: boolean = false;
  isScreenWidthInZone: boolean = false;

  constructor(
    private timerService: TimerService,
    private storageService: StorageService,
    private authService: AuthService,
    private historyService: HistoryService,
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
      this.currentProgressTime < item.mobData.respawnTime
    ) {
      return (
        ((this.currentProgressTime - item.mobData.deathTime) /
          (item.mobData.respawnTime - item.mobData.deathTime)) *
        100
      );
    }

    if (
      item.mobData.respawnTime &&
      this.currentProgressTime >= item.mobData.respawnTime
    ) {
      // let remainingTime = item.mobData.respawnTime - this.currentProgressTime;

      // if (remainingTime <= 0 && !item.isTimerRunning) {
      //   item.isTimerRunning = true;
      //   console.log('Запуск таймера на 1 минут...', item.mob.mobName);
      //   item.timeoutId = setTimeout(() => {
      //     this.onSetByCooldownTime(item);
      //     item.isTimerRunning = false;
      //   }, 1 * 60 * 1000);
      // }

      return 100;
    }

    return 0;
  }

  onClickTimerItem(item: TimerItem): void {
    let data: string = `${item.mob.shortName} - ${moment(
      item.mobData.respawnTime
    ).format('HH:mm:ss')}`;
    this.message.create('success', `${data}`);
    navigator.clipboard.writeText(data);
  }

  showHistoryModal(item: TimerItem): void {
    console.log('showHistoryModal', item.mob.mobName);
    this.getHistory(item);
  }

  confirmHistoryModal(item: TimerItem): void {
    item.mob.isHistoryModalVisible = false;
  }

  cancelHistoryModal(item: TimerItem): void {
    item.mob.isHistoryModalVisible = false;
  }

  getHistory(item: TimerItem): void {
    this.historyService.setIsLoading(true);
    item.mob.isHistoryModalVisible = true;
    this.historyService
      .getHistory(
        this.storageService.getSessionStorage('server'),
        item.mob.mobName
      )
      .subscribe({
        next: (res: any) => {
          console.log(item.mob.mobName, res.data);
          this.historyListData = res;
          this.historyList = res.data;
          this.historyService.setIsLoading(false);
        },
      });
  }

  showDeathModal(item: TimerItem): void {
    item.mob.isDeathModalVisible = true;
    this.currentItem = item;
    this.currentTime = Date.now();
  }

  cancelDeathModal(item: TimerItem): void {
    item.mob.isDeathModalVisible = false;
  }

  confirmDeathModal(item: TimerItem): void {
    item.mob.isDeathOkLoading = true;
    this.timerService.setIsLoading(true);
    console.log('confirm', this.currentItem);
    console.log(moment(this.currentTime).format('HH:mm:ss'));
    if (this.radioValue == 'A') {
      this.timerService
        .setByDeathTime(this.currentItem, moment(this.currentTime).valueOf())
        .subscribe({
          next: (res) => {
            // if (item.timeoutId) {
            //   clearTimeout(item.timeoutId);
            //   item.isTimerRunning = false;
            // }
            this.getAllBosses(1);
            item.mob.isDeathModalVisible = false;
            item.mob.isDeathOkLoading = false;
            this.message.create(
              'success',
              'Респ был успешно обновлён по точному времени смерти'
            );
          },
        });
    }

    if (this.radioValue == 'B') {
      this.timerService
        .setByRespawnTime(this.currentItem, moment(this.currentTime).valueOf())
        .subscribe({
          next: (res) => {
            this.getAllBosses(1);
            item.mob.isDeathModalVisible = false;
            item.mob.isDeathOkLoading = false;
            this.message.create(
              'success',
              'Респ был успешно обновлён по точному времени респауна'
            );
          },
        });
    }

    if (this.radioValue == 'C') {
      this.timerService
        .setByCooldownTime(this.currentItem, Number(this.cooldown))
        .subscribe({
          next: (res) => {
            this.getAllBosses(1);
            item.mob.isDeathModalVisible = false;
            item.mob.isDeathOkLoading = false;
            this.message.create(
              'success',
              `Респ был успешно обновлён по кд ${this.cooldown} раз`
            );
          },
        });
    }
  }

  onDieNow(item: TimerItem): void {
    this.timerService.setIsLoading(true);
    this.currentTime = Date.now();
    console.log('onDieNow', item);
    this.timerService
      .setByDeathTime(item, moment(this.currentTime).valueOf() - 10000)
      .subscribe({
        next: (res) => {
          // if (item.timeoutId) {
          //   clearTimeout(item.timeoutId);
          //   item.isTimerRunning = false;
          // }
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
    this.timerService.setByCooldownTime(item, 1).subscribe({
      next: (res) => {
        // if (item.timeoutId) {
        //   clearTimeout(item.timeoutId);
        //   item.isTimerRunning = false;
        // }
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
        // if (item.timeoutId) {
        //   clearTimeout(item.timeoutId);
        //   item.isTimerRunning = false;
        // }
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
          item.mob.isDeathModalVisible = false;
          item.mob.isDeathOkLoading = false;
          item.mob.isHistoryModalVisible = false;
          item.mob.isHistoryOkLoading = false;
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
      this.currentProgressTime = Date.now();
    }, 1000);

    this.timerService.setIsLoading(true);

    this.checkScreenWidth();
    this.exchangeRefresh();
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

    // this.timerList.forEach((item) => {
    //   if (item.timeoutId) {
    //     clearTimeout(item.timeoutId);
    //     item.isTimerRunning = false;
    //   }
    // });
  }
}
