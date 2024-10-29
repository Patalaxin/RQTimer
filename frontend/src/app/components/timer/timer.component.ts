import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
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
import { UserService } from 'src/app/services/user.service';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly timerService = inject(TimerService);
  private readonly storageService = inject(StorageService);
  private readonly authService = inject(AuthService);
  private readonly historyService = inject(HistoryService);
  private readonly userService = inject(UserService);
  private readonly websocketService = inject(WebsocketService);
  private readonly messageService = inject(NzMessageService);
  private readonly modalService = inject(NzModalService);

  private mobUpdateSubscription: Subscription | undefined;
  permission: string = '';

  timerList: TimerItem[] = [];
  historyList: any = [];
  historyListData: any = [];
  isLoading = this.timerService.isLoading$;
  isHistoryLoading = this.historyService.isLoading$;
  currentServer: string = '';
  currentUser: any = [];

  radioValue: string = 'death';
  currentTime: number = 0;
  currentProgressTime: number = 0;
  currentItem: any;
  cooldown: number = 1;

  intervalId: any;

  isScreenWidth1000: boolean = false;
  isScreenWidth800: boolean = false;
  isScreenWidth750: boolean = false;
  isScreenWidth372: boolean = false;
  isScreenWidthInZone: boolean = false;

  isCreateModalVisible: boolean = false;
  isCreateOkLoading: boolean = false;
  isCreateOkDisabled: boolean = true;

  createEditItem: any;

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenWidth();
  }

  ngOnInit(): void {
    this.timerService.headerVisibility = true;
    Notification.requestPermission().then((perm) => {
      this.permission = perm;
    });

    this.mobUpdateSubscription = this.websocketService.mobUpdate$.subscribe(
      (res: any) => {
        console.log('Mob update received:', res);
        if (res) {
          this.updateItem(this.timerList, res);
        }
      },
    );

    this.timerService.getUnixtime().subscribe({
      next: (res) => {
        this.currentProgressTime = res.unixtime;
        this.intervalId = setInterval(() => {
          this.currentProgressTime += 1000;
          this.timerList.forEach((item) => this.checkAndNotify(item, 1));
        }, 1000);
      },
    });

    this.timerService.isLoading = true;

    this.checkScreenWidth();

    this.getCurrentUser();

    this.timerService.timerList$.subscribe({
      next: (res) => {
        this.timerList = res;
        console.log('timer', this.timerList);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.mobUpdateSubscription) {
      this.mobUpdateSubscription.unsubscribe();
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateItem(timerList: TimerItem[], res: any): void {
    timerList.forEach((item) => {
      if (
        item.mob.mobName === res.mobName &&
        item.mob.location === res.location &&
        item.mob.server === res.server
      ) {
        item.mobData = res.mobData;
        this.sortTimerList(timerList);
      }
    });
  }

  private sortTimerList(timerList: TimerItem[]): void {
    this.timerList = timerList.sort((a, b) => {
      if (!a.mobData.respawnTime) return 1;
      if (!b.mobData.respawnTime) return -1;

      return a.mobData.respawnTime - b.mobData.respawnTime;
    });
  }

  private checkScreenWidth(): void {
    this.isScreenWidth1000 = window.innerWidth <= 1000;
    this.isScreenWidth800 = window.innerWidth <= 800;
    this.isScreenWidth750 = window.innerWidth <= 750;
    this.isScreenWidthInZone =
      window.innerWidth <= 800 && window.innerWidth > 372;
    this.isScreenWidth372 = window.innerWidth <= 372;
  }

  private checkAndNotify(item: TimerItem, minute: number): void {
    const playSound = () => {
      const audio = new Audio('../../../assets/audio/notification.mp3');
      audio.play();
    };

    const sendNotification = (title: string, body: string) => {
      new Notification(title, {
        body,
        icon: `https://www.rqtimer.ru/static/${item.mob.image}`,
      });
      playSound();
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      if (item.mobData.respawnTime) {
        const timeDifference =
          Math.round(
            (item.mobData.respawnTime - this.currentProgressTime) / 1000,
          ) * 1000;

        if (timeDifference === minute * 60000) {
          sendNotification(
            `${item.mob.mobName} - ${item.mob.location}`,
            `${item.mob.mobName} реснется через ${minute} минут.`,
          );
        }

        if (timeDifference === 0) {
          sendNotification(
            `${item.mob.mobName} - ${item.mob.location}`,
            `${item.mob.respawnText}`,
          );
        }
      }
    }
  }

  updatePercent(item: TimerItem): number {
    const { respawnTime, deathTime } = item.mobData;

    if (respawnTime && deathTime) {
      if (this.currentProgressTime < respawnTime) {
        const progressTime = this.currentProgressTime - deathTime;
        const fullTime = respawnTime - deathTime;
        return (progressTime / fullTime) * 100;
      }

      return 100;
    }

    return 0;
  }

  onClickTimerItem(item: TimerItem): void {
    if (item.mobData.respawnTime) {
      let data: string = `${item.mob.shortName} - ${moment(
        item.mobData.respawnTime,
      ).format('HH:mm:ss')}`;
      this.messageService.create('success', `${data}`);
      navigator.clipboard.writeText(data);
    }
  }

  onFocus(event: any) {
    console.log(event.target.closest('.timer-radio-option').previousSibling);
    event.target.closest('.timer-radio-option').previousSibling.click();
  }

  showHistoryModal(item: TimerItem): void {
    event?.stopPropagation();
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
    this.historyService.isLoading = true;
    item.mob.isHistoryModalVisible = true;
    this.historyService
      .getHistory(
        this.storageService.getLocalStorage('server'),
        item.mob.mobName,
      )
      .subscribe({
        next: (res: any) => {
          console.log(item.mob.mobName, res.data);
          this.historyListData = res;
          this.historyList = res.data;
          this.historyService.isLoading = false;
        },
      });
  }

  showCreateEditModal(item?: TimerItem): void {
    event?.stopPropagation();
    if (item) {
      item.mob.isEditModalVisible = true;
    }
    if (!item) {
      this.isCreateModalVisible = true;
    }
  }

  confirmCreateEditModal(item?: TimerItem) {
    const handleResponse = (successMessage: string, errorMessage: string) => ({
      next: () => {
        this.getAllBosses();
        this.messageService.create('success', successMessage);
      },
      error: (err: any) => {
        this.timerService.isLoading = false;
        this.messageService.create(
          'error',
          err ? err.error.message : errorMessage,
        );
      },
    });

    this.timerService.isLoading = true;

    if (!item) {
      this.isCreateModalVisible = false;
      this.timerService
        .createMob(
          this.createEditItem,
          this.storageService.getLocalStorage('server'),
        )
        .subscribe(
          handleResponse(
            'Босс/элитка успешно создан(а).',
            'Не удалось создать босса/элитку.',
          ),
        );
    } else {
      item.mob.isEditModalVisible = false;
      console.log('createEditItem', this.createEditItem);
      this.timerService
        .editMob(
          this.createEditItem,
          this.storageService.getLocalStorage('server'),
        )
        .subscribe(
          handleResponse(
            'Босс/элитка успешно отредактирован(а).',
            'Не удалось отредактировать босса/элитку.',
          ),
        );
    }
  }

  cancelCreateEditModal(item?: TimerItem) {
    if (!item) {
      this.isCreateModalVisible = false;
    }

    if (item) {
      item.mob.isEditModalVisible = false;
    }
  }

  onCreateEdit(item: any) {
    this.createEditItem = { ...item };
    this.isCreateOkDisabled = !(
      this.createEditItem.location &&
      this.createEditItem.cooldownTime &&
      this.createEditItem.mobName
    );
    console.log('onCreateEdit', this.createEditItem);
  }

  showDeleteModal(item: TimerItem): void {
    event?.stopPropagation();
    this.modalService.confirm({
      nzTitle: 'Внимание',
      nzContent: `<b style="color: red;">Вы точно хотите удалить ${item.mob.mobName}?</b>`,
      nzOkText: 'Да',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onDelete(item),
      nzCancelText: 'Нет',
      nzOnCancel: () => console.log('Cancel'),
    });
  }

  onDelete(item: TimerItem): void {
    this.timerService.isLoading = true;
    this.timerService
      .deleteMob(
        item.mob.mobName,
        this.storageService.getLocalStorage('server'),
        item.mob.location,
      )
      .subscribe({
        next: () => {
          this.getAllBosses();
          this.messageService.create(
            'success',
            `${item.mob.mobName} успешно удалён.`,
          );
        },
        error: () => {
          this.timerService.isLoading = false;
        },
      });
  }

  showDeathModal(item: TimerItem): void {
    event?.stopPropagation();
    item.mob.isDeathModalVisible = true;
    this.currentItem = item;
    this.currentTime = this.currentProgressTime;
  }

  cancelDeathModal(item: TimerItem): void {
    item.mob.isDeathModalVisible = false;
  }

  confirmDeathModal(item: TimerItem): void {
    const handleSuccess = (message: string) => {
      this.timerService.isLoading = true;
      this.getAllBosses();
      item.mob.isDeathModalVisible = false;
      item.mob.isDeathOkLoading = false;
      this.messageService.create('success', message);
    };

    const handleError = (err: any) => {
      if (err.status !== 401) {
        item.mob.isDeathOkLoading = false;
      }
    };

    const radioActions: any = {
      death: () => {
        if (
          !this.currentItem.mobData.respawnTime ||
          moment(this.currentTime).valueOf() >
            this.currentItem.mobData.respawnTime
        ) {
          this.timerService
            .setByDeathTime(
              this.currentItem,
              moment(this.currentTime).valueOf(),
            )
            .subscribe({
              next: () => {
                handleSuccess(
                  'Респ был успешно обновлён по точному времени смерти',
                );
                item.mob.isOnDieNow = false;
              },

              error: (err) => handleError(err),
            });
        } else {
          this.showConfirmRewriteModal(this.currentItem, 'death');
        }
      },
      respawn: () => {
        if (
          !this.currentItem.mobData.respawnTime ||
          (this.currentItem.mobData.respawnTime < this.currentItem.unixtime &&
            moment(this.currentTime).valueOf() >=
              this.currentItem.mobData.respawnTime +
                this.currentItem.mob.cooldownTime)
        ) {
          this.timerService
            .setByRespawnTime(
              this.currentItem,
              moment(this.currentTime).valueOf(),
            )
            .subscribe({
              next: () =>
                handleSuccess(
                  'Респ был успешно обновлён по точному времени респауна',
                ),
              error: (err) => handleError(err),
            });
        } else {
          this.showConfirmRewriteModal(this.currentItem, 'respawn');
        }
      },
      cd: () =>
        this.timerService
          .setByCooldownTime(
            item,
            Number(this.cooldown) ? Number(this.cooldown) : 1,
          )
          .subscribe({
            next: () =>
              handleSuccess(
                `Респ был успешно обновлён по кд ${this.cooldown ? this.cooldown : 1} раз`,
              ),
            error: (err) => handleError(err),
          }),
    };

    item.mob.isDeathOkLoading = true;

    console.log('confirm', this.currentItem);
    console.log(moment(this.currentTime).format('HH:mm:ss'));

    const action = radioActions[this.radioValue];
    if (action) {
      action();
    }
  }

  showConfirmRewriteModal(item: TimerItem, action: string) {
    const handleSuccess = (message: string) => {
      this.timerService.isLoading = true;
      item.mob.isOnDieNow = false;
      this.getAllBosses();
      item.mob.isDeathModalVisible = false;
      item.mob.isDeathOkLoading = false;
      this.messageService.create('success', message);
    };

    const handleError = (err: any) => {
      if (err.status !== 401) {
        item.mob.isDeathOkLoading = false;
      }
    };

    const handleText = () => {
      if (item.mobData.respawnTime)
        if (action === 'death') {
          if (item.mobData.respawnTime <= item.unixtime) {
            return `<b>${item.mob.mobName}</b> реснулся в <b>${moment(item.mobData.respawnTime).format('HH:mm:ss (DD/MM/YYYY)')}</b>. Вы точно хотите переписать <b>время смерти</b> на <b>${moment(this.currentTime).format('HH:mm:ss (DD/MM/YYYY)')}</b>?`;
          }

          return `<b>${item.mob.mobName}</b> реснется в <b>${moment(item.mobData.respawnTime).format('HH:mm:ss (DD/MM/YYYY)')}</b>. Вы точно хотите переписать <b>время смерти</b> на <b>${moment(this.currentTime).format('HH:mm:ss (DD/MM/YYYY)')}</b>?`;
        }

      if (item.mobData.respawnTime)
        if (action === 'respawn') {
          console.log('currentItem', item);
          console.log(
            'moment(this.currentTime).valueOf()',
            moment(this.currentTime).valueOf(),
          );

          if (item.mobData.respawnTime < item.unixtime) {
            if (moment(this.currentTime).valueOf() < item.mobData.respawnTime) {
              return `<b>${item.mob.mobName}</b> уже реснулся в <b>${moment(item.mobData.respawnTime).format('HH:mm:ss (DD/MM/YYYY)')}</b>. Вы точно хотите переписать <b>время респауна</b> на <b>${moment(this.currentTime).format('HH:mm:ss (DD/MM/YYYY)')}</b>?`;
            }

            if (
              moment(this.currentTime).valueOf() > item.mobData.respawnTime &&
              moment(this.currentTime).valueOf() <
                item.mobData.respawnTime + item.mob.cooldownTime
            ) {
              return `<b>${item.mob.mobName}</b> уже реснулся в <b>${moment(item.mobData.respawnTime).format('HH:mm:ss (DD/MM/YYYY)')}</b> и следующий респаун предположительно будет в <b>${moment(item.mobData.respawnTime + item.mob.cooldownTime).format('HH:mm:ss (DD/MM/YYYY)')}</b>. Вы точно хотите переписать <b>время респауна</b> на <b>${moment(this.currentTime).format('HH:mm:ss (DD/MM/YYYY)')}</b>?`;
            }
          }

          if (item.mobData.respawnTime > item.unixtime) {
            if (
              moment(this.currentTime).valueOf() !== item.mobData.respawnTime
            ) {
              return `Cледующий респаун <b>${item.mob.mobName}</b> будет в <b>${moment(item.mobData.respawnTime).format('HH:mm:ss (DD/MM/YYYY)')}</b>. Вы точно хотите переписать <b>время респауна</b> на <b>${moment(this.currentTime).format('HH:mm:ss (DD/MM/YYYY)')}</b>?`;
            }
          }
        }

      return action === 'death'
        ? 'death'
        : action === 'respawn'
          ? 'respawn'
          : 'cd';
    };

    this.modalService.confirm({
      nzTitle: 'Внимание',
      nzContent: handleText(),
      nzCentered: true,
      nzOkText: 'Да',
      nzOnOk: () => {
        if (action === 'death') {
          this.timerService
            .setByDeathTime(item, moment(this.currentTime).valueOf())
            .subscribe({
              next: () =>
                handleSuccess(
                  'Респ был успешно обновлён по точному времени смерти',
                ),
              error: (err) => handleError(err),
            });
        }

        if (action === 'respawn') {
          this.timerService
            .setByRespawnTime(item, moment(this.currentTime).valueOf())
            .subscribe({
              next: () =>
                handleSuccess(
                  'Респ был успешно обновлён по точному времени респауна',
                ),
              error: (err) => handleError(err),
            });
        }

        if (action === 'cd') {
          this.timerService
            .setByCooldownTime(
              item,
              Number(this.cooldown) ? Number(this.cooldown) : 1,
            )
            .subscribe({
              next: () =>
                handleSuccess(
                  `Респ был успешно обновлён по кд ${this.cooldown ? this.cooldown : 1} раз`,
                ),
              error: (err) => handleError(err),
            });
        }
      },
      nzCancelText: 'Нет',
      nzOnCancel: () => {
        item.mob.isDeathOkLoading = false;
        item.mob.isOnDieNow = false;
      },
    });
  }

  onDieNow(item: TimerItem): void {
    event?.stopPropagation();
    item.mob.isOnDieNow = true;
    if (
      !item.mobData.respawnTime ||
      moment(this.currentTime).valueOf() > item.mobData.respawnTime
    ) {
      this.timerService.isLoading = true;
      this.timerService.getUnixtime().subscribe({
        next: (res) => {
          this.currentTime = res ? res.unixtime : Date.now();
          this.timerService
            .setByDeathTime(item, this.currentTime - 10000)
            .subscribe({
              next: () => {
                this.getAllBosses();
                this.messageService.create(
                  'success',
                  'Респ был успешно переписан',
                );
                item.mob.isOnDieNow = false;
              },
            });
        },
      });
    } else {
      this.showConfirmRewriteModal(item, 'death');
    }
  }

  onPlusCooldown(item: TimerItem): void {
    event?.stopPropagation();
    item.mob.plusCooldown++;
    if (item.mobData.respawnTime) {
      item.mobData.respawnTime += item.mob.cooldownTime;
    }
  }

  onSetByCooldownTime(item: TimerItem): void {
    event?.stopPropagation();
    this.timerService.isLoading = true;
    this.timerService.setByCooldownTime(item, 1).subscribe({
      next: () => {
        // if (item.timeoutId) {
        //   clearTimeout(item.timeoutId);
        //   item.isTimerRunning = false;
        // }
        this.getAllBosses();
        this.messageService.create(
          'success',
          'Респ был успешно переписан по кд',
        );
      },
      error: (err) => {
        this.messageService.create('error', 'Респ утерян');
        this.timerService.isLoading = false;
      },
    });
  }

  onLostCooldown(item: TimerItem): void {
    event?.stopPropagation();
    this.timerService.isLoading = true;
    console.log('onDieNow', item);
    this.timerService.respawnLost(item).subscribe({
      next: () => {
        // if (item.timeoutId) {
        //   clearTimeout(item.timeoutId);
        //   item.isTimerRunning = false;
        // }
        this.getAllBosses();
      },
    });
  }

  getAllBosses(): void {
    this.currentServer = this.storageService.getLocalStorage('server');
    console.log(this.currentServer);
    this.timerService.getAllBosses(this.currentServer).subscribe({
      next: (res) => {
        console.log(res);
        this.currentTime = res.length ? res[0].unixtime : Date.now();
        this.currentProgressTime = res.length ? res[0].unixtime : Date.now();
        console.log('cT', this.currentTime, 'cPT', this.currentProgressTime);
        this.sortTimerList([...res]);

        this.timerList.forEach((item) => {
          item.mob.plusCooldown = 0;
          item.mob.isDeathModalVisible = false;
          item.mob.isDeathOkLoading = false;
          item.mob.isHistoryModalVisible = false;
          item.mob.isHistoryOkLoading = false;
          item.mob.isEditModalVisible = false;
          item.mob.isEditOkLoading = false;
        });
        this.timerService.isLoading = false;
      },
    });
  }

  onLogout(): void {
    this.authService.signOut().subscribe({
      next: () => {
        this.timerService.headerVisibility = false;
        this.storageService.clean();
        this.router.navigate(['/login']);
      },
    });
  }

  getCurrentUser() {
    this.userService.getUser().subscribe({
      next: (res) => {
        this.userService.currentUser = res;
        this.userService.currentUser$.subscribe({
          next: (res) => {
            this.currentUser = res;
          },
        });
        this.getAllBosses();
      },
    });
  }
}
