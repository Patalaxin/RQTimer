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
import { GroupsService } from 'src/app/services/groups.service';
import { HistoryService } from 'src/app/services/history.service';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';
import { TokenService } from 'src/app/services/token.service';
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
  private readonly groupsService = inject(GroupsService);
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  private readonly historyService = inject(HistoryService);
  private readonly userService = inject(UserService);
  private readonly websocketService = inject(WebsocketService);
  private readonly messageService = inject(NzMessageService);
  private readonly modalService = inject(NzModalService);

  private mobUpdateSubscription: Subscription | undefined;
  private worker: Worker | undefined;
  permission: string = '';

  timerList: TimerItem[] = [];
  availableMobList: any = [];
  addMobList: any = [];
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
  isScreenWidth550: boolean = false;
  isScreenWidth372: boolean = false;
  isScreenWidthInZone: boolean = false;

  isAddModalVisible: boolean = false;
  isAddOkLoading: boolean = false;
  isAddModalLoading: boolean = true;

  userGroupName: any;
  groupModalName: string = '';
  groupModalPlaceholder: string = '';
  groupOkButton: string = '';
  groupInputValue: string = '';
  groupModalMode: 'create' | 'join' = 'create';
  isGroupModalVisible: boolean = false;
  isGroupModalLoading: boolean = false;
  isGroupModalDisabled: boolean = true;
  isCreateGroupLoading: boolean = false;
  isJoinGroupLoading: boolean = false;
  userGroupList: any[] = [];
  groupLeaderEmail: string = '';
  onlineUserList: any[] = [];

  allAddChecked: boolean = false;
  indeterminate: boolean = false;

  timerOptions: any[] = [
    { label: 'Таймер', value: 'Timer', icon: 'history' },
    { label: 'Настройки', value: 'Settings', icon: 'setting' },
  ];
  selectedSegments: number = 0;

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenWidth();
  }

  ngOnInit(): void {
    this.timerService.headerVisibility = true;
    if ('Notification' in window) {
      Notification?.requestPermission().then((perm) => {
        this.permission = perm;
      });
    }

    this.mobUpdateSubscription = this.websocketService.mobUpdate$.subscribe(
      (res: TimerItem) => {
        if (res) {
          this.updateItem(this.timerList, res);
        }
      },
    );

    this.updateWorkers();

    this.checkScreenWidth();

    this.getCurrentUser();

    this.getOnlineUserList();

    this.getTimerList();
  }

  ngOnDestroy(): void {
    if (this.mobUpdateSubscription) {
      this.mobUpdateSubscription.unsubscribe();
    }

    if (this.worker) {
      this.worker.terminate();
    }

    // if (this.intervalId) {
    //   clearInterval(this.intervalId);
    // }
  }

  private getOnlineUserList(): void {
    this.websocketService.onlineUserList$.subscribe((res: any) => {
      if (res) {
        res.map((item: any) => {
          this.onlineUserList.push(item.email);
        });
      }
    });
  }

  private getTimerList(): void {
    this.timerService.timerList$.subscribe({
      next: (res) => {
        this.timerList = res;
      },
    });
  }

  private updateWorkers(): void {
    this.timerService.getUnixtime().subscribe({
      next: (res) => {
        this.currentProgressTime = res.unixtime;

        if (typeof Worker !== 'undefined') {
          this.worker = new Worker(
            new URL('../../workers/timer.worker', import.meta.url),
          );

          this.worker.postMessage({
            currentProgressTime: this.currentProgressTime,
          });

          this.worker.onmessage = (event) => {
            const { updatedProgressTime } = event.data;
            this.currentProgressTime = updatedProgressTime;
            this.timerList.forEach((item) => this.checkAndNotify(item, 1));
          };
        } else {
          console.log('Web Workers не поддерживаются');
        }

        // this.intervalId = setInterval(() => {
        //   this.currentProgressTime += 1000;
        //   this.timerList.forEach((item) => this.checkAndNotify(item, 1));
        // }, 1000);
      },
    });
  }

  private updateItem(timerList: TimerItem[], res: any): void {
    timerList.forEach((item) => {
      if (
        item.mob.mobName === res.mob.mobName &&
        item.mob.location === res.mob.location &&
        item.mobData.server === res.mobData.server
      ) {
        item.mobData = res.mobData;
        timerList.forEach((item) => {
          item.mob.plusCooldown = 0;
          item.mob.isDeathModalVisible = false;
          item.mob.isDeathOkLoading = false;
          item.mob.isHistoryModalVisible = false;
          item.mob.isHistoryOkLoading = false;
          item.mob.isInfoModalVisible = false;
          item.mob.isInfoOkLoading = false;
          item.mob.isOnDieNow = false;
        });

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
    this.isScreenWidth550 = window.innerWidth <= 550;
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

    if ('Notification' in window && Notification?.permission === 'granted') {
      if (item.mobData.respawnTime) {
        const timeDifference =
          moment
            .utc(
              moment(item.mobData.respawnTime).diff(
                moment(this.currentProgressTime),
              ),
            )
            .valueOf() - 1000; // 1000 - 1 сек погрешности

        // if (item.mob.mobName === 'Архон')
        //   console.log(moment.utc(timeDifference).format('HH:mm:ss'));

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
    event.target.closest('.timer-radio-option').previousSibling.click();
  }

  showHistoryModal(item: TimerItem): void {
    event?.stopPropagation();
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
          this.historyListData = res;
          this.historyList = res.data;
          this.historyService.isLoading = false;
        },
      });
  }

  showAddModal(): void {
    this.allAddChecked = false;
    this.indeterminate = false;
    this.isAddModalLoading = true;
    this.isAddModalVisible = true;
    this.timerService.getAvailableBosses().subscribe({
      next: (res) => {
        this.availableMobList = res.filter(
          (availableItem: any) =>
            !this.timerList.some(
              (timerItem) =>
                timerItem.mob.mobName === availableItem.mobName &&
                timerItem.mob.location === availableItem.location,
            ),
        );
        this.isAddModalLoading = false;
      },
    });
  }

  cancelAddModal(): void {
    this.isAddModalVisible = false;
    this.addMobList = [];
  }

  onAddMobs(): void {
    this.isAddOkLoading = true;
    this.timerService.isLoading = true;
    this.timerService
      .addMobGroup(this.currentServer, this.addMobList)
      .subscribe({
        next: () => {
          this.getAllBosses();
          this.isAddOkLoading = false;
          this.isAddModalVisible = false;
          this.messageService.create(
            'success',
            'Боссы/элитки были успешно добавлены.',
          );
        },
        error: () => {
          this.isAddOkLoading = false;
          this.timerService.isLoading = false;
        },
      });
  }

  addAllChecked(): void {
    this.indeterminate = false;
    const mobsCheckbox = Array.from(document.querySelectorAll('.add-mob'));
    if (this.allAddChecked) {
      mobsCheckbox.map((item: any) => {
        if (
          !item
            .querySelector('.ant-checkbox')
            .classList.contains('ant-checkbox-checked')
        ) {
          item.click();
        }
      });
    } else {
      mobsCheckbox.map((item: any) => {
        if (
          item
            .querySelector('.ant-checkbox')
            .classList.contains('ant-checkbox-checked')
        ) {
          item.click();
        }
      });
    }
  }

  onChangeCheckbox(event: any): void {
    console.log(event);
    if (
      this.availableMobList.filter(
        (availableItem: any) =>
          !event.some(
            (timerItem: any) =>
              timerItem ===
              `${availableItem.mobName}: ${availableItem.location}`,
          ),
      ).length
    ) {
      this.allAddChecked = false;
      this.indeterminate = false;

      if (
        this.availableMobList.filter(
          (availableItem: any) =>
            !event.some(
              (timerItem: any) =>
                timerItem ===
                `${availableItem.mobName}: ${availableItem.location}`,
            ),
        ).length !== this.availableMobList.length
      ) {
        this.indeterminate = true;
      }
    } else if (
      !this.availableMobList.filter(
        (availableItem: any) =>
          !event.some(
            (timerItem: any) =>
              timerItem ===
              `${availableItem.mobName}: ${availableItem.location}`,
          ),
      ).length
    ) {
      this.allAddChecked = true;
      this.indeterminate = false;
    }

    this.addMobList = event;
  }

  showInfoModal(item: TimerItem): void {
    event?.stopPropagation();
    item.mob.isInfoModalVisible = true;
  }

  cancelInfoModal(item: TimerItem) {
    item.mob.isInfoModalVisible = false;
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
      .deleteMobGroup(
        this.storageService.getLocalStorage('server'),
        item.mob.location,
        item.mob.mobName,
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
    const handleSuccess = (message: string, item: TimerItem) => {
      this.timerService.isLoading = true;
      if (item) {
        this.updateItem(this.timerList, item);
      }
      this.timerService.isLoading = false;
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
              next: (res: any) => {
                handleSuccess(
                  'Респ был успешно обновлён по точному времени смерти',
                  res,
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
              next: (res: any) =>
                handleSuccess(
                  'Респ был успешно обновлён по точному времени респауна',
                  res,
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
            next: (res: any) =>
              handleSuccess(
                `Респ был успешно обновлён по кд ${this.cooldown ? this.cooldown : 1} раз`,
                res,
              ),
            error: (err) => handleError(err),
          }),
    };

    item.mob.isDeathOkLoading = true;

    const action = radioActions[this.radioValue];
    if (action) {
      action();
    }
  }

  showConfirmRewriteModal(item: TimerItem, action: string) {
    const handleSuccess = (message: string, item: TimerItem) => {
      this.timerService.isLoading = true;
      if (item) {
        this.updateItem(this.timerList, item);
      }
      this.timerService.isLoading = false;
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
              next: (res: any) =>
                handleSuccess(
                  'Респ был успешно обновлён по точному времени смерти',
                  res,
                ),
              error: (err) => handleError(err),
            });
        }

        if (action === 'respawn') {
          this.timerService
            .setByRespawnTime(item, moment(this.currentTime).valueOf())
            .subscribe({
              next: (res: any) =>
                handleSuccess(
                  'Респ был успешно обновлён по точному времени респауна',
                  res,
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
              next: (res: any) =>
                handleSuccess(
                  `Респ был успешно обновлён по кд ${this.cooldown ? this.cooldown : 1} раз`,
                  res,
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
              next: (res: TimerItem) => {
                this.updateItem(this.timerList, res);
                this.timerService.isLoading = false;
                this.messageService.create(
                  'success',
                  'Респ был успешно переписан',
                );
                item.mob.isOnDieNow = false;
              },
            });
        },
        error: () => {
          this.timerService.isLoading = false;
          item.mob.isOnDieNow = false;
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
      next: (res: TimerItem) => {
        // if (item.timeoutId) {
        //   clearTimeout(item.timeoutId);
        //   item.isTimerRunning = false;
        // }
        if (res) {
          this.updateItem(this.timerList, res);
        }
        this.timerService.isLoading = false;
        this.messageService.create(
          'success',
          'Респ был успешно переписан по кд',
        );
      },
      error: () => {
        this.messageService.create('error', 'Респ утерян');
        this.timerService.isLoading = false;
      },
    });
  }

  onLostCooldown(item: TimerItem): void {
    event?.stopPropagation();
    this.timerService.isLoading = true;
    this.timerService.respawnLost(item).subscribe({
      next: (res: TimerItem) => {
        // if (item.timeoutId) {
        //   clearTimeout(item.timeoutId);
        //   item.isTimerRunning = false;
        // }
        if (res) {
          this.updateItem(this.timerList, res);
        }
        this.timerService.isLoading = false;
      },
      error: () => {
        this.timerService.isLoading = false;
      },
    });
  }

  getAllBosses(): void {
    this.currentServer = this.storageService.getLocalStorage('server');
    this.timerService.getAllBosses(this.currentServer).subscribe({
      next: (res) => {
        this.currentTime = res.length ? res[0].unixtime : Date.now();
        this.currentProgressTime = res.length ? res[0].unixtime : Date.now();
        this.sortTimerList([...res]);

        this.timerList.forEach((item) => {
          item.mob.plusCooldown = 0;
          item.mob.isDeathModalVisible = false;
          item.mob.isDeathOkLoading = false;
          item.mob.isHistoryModalVisible = false;
          item.mob.isHistoryOkLoading = false;
          item.mob.isInfoModalVisible = false;
          item.mob.isInfoOkLoading = false;
        });
        this.timerService.isLoading = false;
      },
      error: () => {
        this.timerService.isLoading = false;
      },
    });
  }

  getCurrentUser() {
    this.timerService.isLoading = true;
    this.userService.getUser().subscribe({
      next: (res) => {
        this.userGroupName = res.groupName;
        if (res.groupName) {
          this.groupsService.getGroup().subscribe({
            next: (res) => {
              this.groupLeaderEmail = res.groupLeader;
              res.members.map((member: string) => {
                let nickname: string = member.split(': ')[0];
                let email: string = member.split(': ')[1];
                this.userGroupList.push({ nickname, email });
              });
              this.userGroupList.forEach((item: any, i: any) => {
                item.id = i++;
              });
            },
          });
        }
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

  onGroupValueChange(event: any) {
    this.groupInputValue = event;

    if (!this.groupInputValue) {
      this.isGroupModalDisabled = true;
    } else {
      this.isGroupModalDisabled = false;
    }
  }

  showCreateGroupModal() {
    this.groupInputValue = '';
    this.isCreateGroupLoading = true;
    this.isGroupModalVisible = true;
    this.groupModalName = 'Создать группу';
    this.groupModalPlaceholder = 'Введите название группы';
    this.groupOkButton = 'Создать';
    this.groupModalMode = 'create';
  }

  showJoinGroupModal() {
    this.groupInputValue = '';
    this.isJoinGroupLoading = true;
    this.isGroupModalVisible = true;
    this.groupModalName = 'Присоединиться к группе';
    this.groupModalPlaceholder = 'Введите код приглашение';
    this.groupOkButton = 'Вступить';
    this.groupModalMode = 'join';
  }

  cancelGroupModal() {
    this.isGroupModalVisible = false;
    if (this.groupModalMode === 'create') {
      this.isCreateGroupLoading = false;
    }
    if (this.groupModalMode === 'join') {
      this.isJoinGroupLoading = false;
    }
  }

  confirmGroupModal() {
    this.isGroupModalLoading = true;
    if (this.groupModalMode === 'create') {
      this.onCreateGroup(this.groupInputValue);
    }
    if (this.groupModalMode === 'join') {
      this.onJoinGroup(this.groupInputValue);
    }
  }

  onExchangeRefresh(event: any): void {
    this.exchangeRefresh(() => {
      this.getCurrentUser();
    });
  }

  private onCreateGroup(name: string) {
    this.groupsService.createGroup(name).subscribe({
      next: () => {
        this.exchangeRefresh(() => {
          this.isCreateGroupLoading = false;
          this.getCurrentUser();
        });
      },
      error: () => {
        this.isGroupModalLoading = false;
      },
    });
  }

  private onJoinGroup(code: string) {
    this.groupsService.joinGroup(code).subscribe({
      next: () => {
        this.exchangeRefresh(() => {
          this.isJoinGroupLoading = false;
          this.getCurrentUser();
        });
      },
      error: () => {
        this.isGroupModalLoading = false;
      },
    });
  }

  private exchangeRefresh(callback: Function) {
    this.tokenService.refreshToken().subscribe({
      next: (res) => {
        this.isGroupModalLoading = false;
        this.isGroupModalVisible = false;
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

  private onLogout(): void {
    this.authService.signOut().subscribe({
      next: () => {
        this.timerService.headerVisibility = false;
        this.websocketService.disconnect();
        this.storageService.clean();
        this.router.navigate(['/login']);
      },
    });
  }
}
