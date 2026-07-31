import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  NzNotificationPlacement,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { IStepOption, TourService } from 'ngx-ui-tour-tui-dropdown';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ITimerItem, IFullMob } from 'src/app/interfaces/timer-item';
import { IUser } from 'src/app/interfaces/user';
import { IMobCatalog } from 'src/app/interfaces/mob-catalog-entry';
import { IGroupMember } from 'src/app/interfaces/group';
import { INotification } from 'src/app/interfaces/notification';
import {
  IHistoryEntry,
  IPaginatedHistory,
} from 'src/app/interfaces/history-entry';
import { AuthService } from 'src/app/services/auth.service';
import { BindingService } from 'src/app/services/binding.service';
import { GroupsService } from 'src/app/services/groups.service';
import { HistoryService } from 'src/app/services/history.service';
import { NotificationService } from 'src/app/services/notification.service';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';
import { TokenService } from 'src/app/services/token.service';
import { UserService } from 'src/app/services/user.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { environment } from 'src/environments/environment';

interface IAvailableMob extends IMobCatalog {
  isExcluded: boolean;
}

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TimerComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly timerService = inject(TimerService);
  private readonly storageService = inject(StorageService);
  private readonly groupsService = inject(GroupsService);
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  private readonly historyService = inject(HistoryService);
  private readonly userService = inject(UserService);
  private readonly websocketService = inject(WebsocketService);
  private readonly notificationService = inject(NotificationService);
  private readonly nzNotificationService = inject(NzNotificationService);
  private readonly messageService = inject(NzMessageService);
  private readonly modalService = inject(NzModalService);
  private readonly tourService = inject(TourService);
  private readonly translateService = inject(TranslateService);
  private readonly bindingService = inject(BindingService);

  private mobUpdateSubscription: Subscription | undefined;
  private excludedMobsSubscription: Subscription | undefined;
  private notificationsSubscription: Subscription | undefined;
  private readonly destroy$ = new Subject<void>();
  private worker: Worker | undefined;
  private isInitialized = false;
  permission: string = '';

  IMAGE_SRC = environment.staticUrl;

  timerList: ITimerItem[] = [];
  availableMobList: IAvailableMob[] = [];
  filteredMobList: IAvailableMob[] = [];
  addedMobList: string[] = [];
  pvpMobList: string[] = [
    '673148be1e738aba75ba344d',
    '673149261e738aba75ba3455',
    '673a4607925dabf6e082f029',
    '673a4636925dabf6e082f03f',
    '67314b311e738aba75ba3475',
  ];

  randomTimeMobList: string[] = ['6a5d0bda682ea4717f616c1a'];

  addMobList: string[] = [];
  historyList: IHistoryEntry[] = [];
  historyListData: IPaginatedHistory | null = null;
  isLoading = this.timerService.isLoading$;
  isHistoryLoading = this.historyService.isLoading$;
  currentServer: string = '';
  currentUser: IUser | null = null;
  excludedMobs: string[] = [];

  radioValue: string = 'death';
  datePickerTime: Date | undefined;
  timePickerTime: Date | undefined;
  currentTime: number = 0;
  currentProgressTime: number = 0;
  currentItem: ITimerItem | undefined;
  cooldown: number = 1;

  intervalId: ReturnType<typeof setInterval> | undefined;

  isScreenWidth1000: boolean = false;
  isScreenWidth800: boolean = false;
  isScreenWidth750: boolean = false;
  isScreenWidth550: boolean = false;
  isScreenWidth372: boolean = false;
  isScreenWidthInZone: boolean = false;

  isAddModalVisible: boolean = false;
  isAddOkLoading: boolean = false;
  isAddModalLoading: boolean = true;

  userGroupName: string = '';
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
  userGroupList: IGroupMember[] = [];
  groupLeaderEmail: string = '';
  onlineUserList: string[] = [];
  canMembersAddMobs: boolean = false;

  allAddChecked: boolean = false;
  indeterminate: boolean = false;
  checkedMobIds: string[] = [];

  addSearchValue: string = '';

  isOnlyComment: boolean = false;
  comment: string = '';

  isVisible: boolean = false;

  timerOptions: { label: string; value: number; icon: string }[] = [];
  selectedSegments: number = 0;

  notifications: INotification[] = [];
  currentNotificationIndex: number = 0;
  position: NzNotificationPlacement | undefined = 'bottomRight';

  language: string = 'ru';
  isLangReady: boolean = false;

  isDesync: boolean = false;
  desyncTime: number | undefined;

  private audioQueue: HTMLAudioElement[] = [];
  private isPlayingAudio = false;
  private playNextAudio: () => void = () => {};

  private readonly steps: IStepOption[] = [
    {
      anchorId: 'timer',
      title: 'Привет',
      content:
        'На связи <b>Жевти</b>! Cейчас я покажу основной функционал таймера!',
    },
    {
      anchorId: 'server',
      title: 'Выбор сервера',
      content:
        'Вот тут можно выбрать <b>сервер</b>, у каждого сервера естественно свой <b>таймер</b>, не перепутай',
    },
    {
      anchorId: 'timer-item',
      title: 'Таймер',
      isOptional: true,
      content:
        'Каждый моб будет изображён такой плашкой с множеством кнопок. Да, кнопок много, но с ними мы сейчас разберёмся',
    },
    {
      anchorId: 'rewrite',
      title: 'Переписать',
      isOptional: true,
      content: `С помощью этой <b>кнопки</b> можно переписать моба 3мя способами:<br>
      1) По <b>точному времени смерти</b><br>
      2) По <b>точному времени респауна</b><br>
      3) По <b>количеству раз по кд</b>`,
    },
    {
      anchorId: 'die-now',
      title: 'Упал сейчас',
      isOptional: true,
      content: `Эта <b>кнопка</b> позволяет переписать моба сразу <b>непосредственно после смерти</b>. Я также учёл среднее время нужное для того, чтоб открыть браузер и нажать кнопку, примерно на это уходит <b>~10 сек.</b>`,
    },
    {
      anchorId: 'mob-history',
      title: 'История переписи моба',
      isOptional: true,
      content: `Тут можно увидеть <b>историю переписи определенного моба</b>: кто переписал, каким способом, исходные и итоговые значения времени после переписи`,
    },
    {
      anchorId: 'plus-cooldown',
      title: 'Симуляция кд респауна',
      isOptional: true,
      content: `Например, я знаю, что <b>не успею</b> зайти до реса моба, с помощью этой <b>кнопки</b> я могу получить <b>время следующего кдшного респа</b>, чтоб рассчитать свое время<br><br><b>Важно:</b> эта кнопка только <b>симулирует респ</b>, видите это значение только вы`,
    },
    {
      anchorId: 'cooldown',
      title: 'Переписать по кд',
      isOptional: true,
      content: `А вот эта <b>кнопка</b> уже <b>переписывает и отображает кдшный респ</b> для всех участников группы`,
    },
    {
      anchorId: 'lost-cooldown',
      title: 'Респаун утерян',
      isOptional: true,
      content: `Ну тут понятно, когда <b>теряете респаун</b>, и не знаете точное время, лучше нажать эту кнопку, чтоб <b>сбросить все значений времени</b> для данного моба`,
    },
    {
      anchorId: 'delete',
      title: 'Удалить',
      isOptional: true,
      content: `<b>Удаляет</b> моба из группы`,
    },
    {
      anchorId: 'add',
      title: 'Добавить',
      isOptional: true,
      content: `А эта <b>кнопка</b>, наоборот, <b>добавляет</b> моба в группу`,
    },
    {
      anchorId: 'timer-settings',
      title: 'Таймер и его настройки',
      content: `Нуууу, хз что сказать, в самом названии все сказано :D`,
    },
    {
      anchorId: 'header',
      title: 'Хедер',
      content: `Так-с, с основными кнопками таймера закончили, дальше рассмотрим <b>функций хедера</b>`,
    },
    {
      anchorId: 'search',
      title: 'Поиск',
      content: `Осуществляет <b>поиск</b> определенного моба`,
    },
    {
      anchorId: 'reload',
      title: 'Обновить',
      content: `<b>Обновляет</b> таймер при необходимости`,
    },
    {
      anchorId: 'copy',
      title: 'Скопировать',
      content: `<b>Копирует все респы</b> в таймере, кроме утерянных`,
    },
    {
      anchorId: 'connection',
      title: 'Падение сервера',
      content: `При <b>падении сервера игры</b> жмётся эта кнопка, чтоб <b>учитывать время отката</b> при отключении серверов. Также эта кнопка позволяет увидеть <b>статус</b>:<br>
        1) <b>Online</b> - зелёный<br>
        2) <b>Offline</b> - красный`,
    },
    {
      anchorId: 'history',
      title: 'История переписи',
      content: `Вот эта <b>кнопка</b> уже показывает <b>общую историю переписи</b> всех мобов`,
    },
    {
      anchorId: 'settings',
      title: 'Персональные настройки',
      content: `Можно будет <b>настроить отображение мобов</b> или <b>поменять пароль</b>`,
    },
    {
      anchorId: 'logout',
      title: 'Выход',
      content: `Выйди и зайди нормально, пон?`,
    },
    {
      anchorId: 'notification',
      title: 'Уведомления',
      content: `Тут можно будет просмотреть актуальные уведомления от нас, разработчиков`,
    },
    {
      anchorId: 'telegram-bot',
      title: 'Telegram-бот',
      content: `По многочисленным просьбам, добавили также Telegram-бота, который будет <b>присылать переписанные респы</b>`,
      isOptional: true,
    },
  ];

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenWidth();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyEvents(event: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

    // if (ctrlOrCmd && event.key.toLowerCase() === 'r') {
    //   event.preventDefault();
    //   this.bindingService.triggerClickReloadButton();
    // }

    // if (ctrlOrCmd && event.key.toLowerCase() === 'c') {
    //   event.preventDefault();
    //   this.bindingService.triggerClickCopyButton();
    // }

    if (ctrlOrCmd && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.bindingService.triggerFocusSearchInput();
    }
  }

  @ViewChild('notificationTemplate', { static: false })
  template?: TemplateRef<any>;

  ngOnInit(): void {
    this.language = localStorage.getItem('language') || 'ru';
    this.isLangReady = true;

    this.setTimerOptions();

    this.translateService.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.setTimerOptions();
        this.cdr.markForCheck();
      });

    this.currentNotificationIndex = 0;

    this.timerService.telegramBotVisibility$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isVisible = res;
          this.cdr.markForCheck();
        },
      });

    this.tourService.initialize(this.steps, {
      enableBackdrop: true,
      backdropConfig: {
        offset: 5,
      },
      centerAnchorOnScroll: false,
      prevBtnTitle: 'Назад',
      nextBtnTitle: 'Вперёд',
      endBtnTitle: 'Конец',
    });

    this.timerService.headerVisibility = true;
    if ('Notification' in window) {
      Notification?.requestPermission().then((perm) => {
        this.permission = perm;
      });
    }

    this.mobUpdateSubscription = this.websocketService.mobUpdate$.subscribe(
      (res: IFullMob | null) => {
        if (res) {
          this.updateItem(this.timerList, res);
          this.cdr.markForCheck();
        }
      },
    );

    this.excludedMobsSubscription = this.userService.excludedMobs$.subscribe({
      next: (excludedMobs) => {
        this.excludedMobs = excludedMobs;
        if (this.timerList.length > 0) {
          const filteredRes = this.timerService.filterExcludedMobs(
            this.timerList,
            excludedMobs,
          );
          this.sortTimerList([...filteredRes]);
          this.timerService.timerList = this.timerList;
        }
        this.cdr.markForCheck();
      },
    });

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
    if (this.excludedMobsSubscription) {
      this.excludedMobsSubscription.unsubscribe();
    }

    if (this.worker) {
      this.worker.terminate();
    }

    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }

    this.tourService.end();
    this.isInitialized = false;

    this.destroy$.next();
    this.destroy$.complete();

    // if (this.intervalId) {
    //   clearInterval(this.intervalId);
    // }
  }

  private setTimerOptions() {
    this.timerOptions = [
      {
        label: this.translateService.instant('TIMER.TIMER'),
        value: 0,
        icon: 'history',
      },
      {
        label: this.translateService.instant('TIMER.SETTINGS'),
        value: 1,
        icon: 'setting',
      },
    ];
  }

  private getOnlineUserList(): void {
    this.websocketService.onlineUserList$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.onlineUserList = res.map((item) => item.email);
          this.cdr.markForCheck();
        }
      });
  }

  private getTimerList(): void {
    this.timerService.filteredTimerList$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.timerList = res;
          this.cdr.markForCheck();
        },
      });
  }

  private updateWorkers(): void {
    this.timerService
      .getUnixtime()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.currentProgressTime = res.unixtime;

          if (Math.abs(this.currentProgressTime - Date.now()) >= 15000) {
            this.isDesync = true;
            this.desyncTime = Math.ceil(
              Math.abs(this.currentProgressTime - Date.now()) / 1000,
            );
          }

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
              this.timerList.forEach((item) => {
                item.mob.percent = this.calcPercent(item);
                this.checkAndNotify(item, [1, 5]);
              });
              this.cdr.markForCheck();
            };
          } else {
            console.log('Web Workers не поддерживаются');
          }

          this.cdr.markForCheck();
        },
      });
  }

  private updateItem(timerList: ITimerItem[], res: IFullMob): void {
    timerList.forEach((item) => {
      if (
        item.mobData.mobId === res.mobData.mobId &&
        item.mobData.server === res.mobData.server
      ) {
        item.mobData = res.mobData;
        item.mob.plusCooldown = 0;
        item.mob.isDeathModalVisible = false;
        item.mob.isDeathOkLoading = false;
        item.mob.isHistoryModalVisible = false;
        item.mob.isHistoryOkLoading = false;
        item.mob.isInfoModalVisible = false;
        item.mob.isInfoOkLoading = false;
        item.mob.isOnDieNow = false;

        this.sortTimerList(timerList);
      }
    });
  }

  private sortTimerList(timerList: ITimerItem[]): void {
    timerList.forEach((item) => {
      item.mob.percent = this.calcPercent(item);
    });

    this.timerList = this.timerService.sortByRespawnTime(timerList);
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

  private checkAndNotify(item: ITimerItem, minutes: number[]): void {
    const enqueueAudio = (audio: HTMLAudioElement) => {
      this.audioQueue.push(audio);
      this.playNextAudio();
    };

    this.playNextAudio = () => {
      if (this.isPlayingAudio || this.audioQueue.length === 0) return;

      this.isPlayingAudio = true;
      const nextAudio = this.audioQueue.shift()!;
      nextAudio.volume = Number(localStorage.getItem('volume') || '50') / 100;
      nextAudio.play();

      nextAudio.onended = () => {
        this.isPlayingAudio = false;
        this.playNextAudio();
      };
    };

    const playSound = (timeDifference: number) => {
      const specialNotification = JSON.parse(
        localStorage.getItem('specialNotification') || 'false',
      );
      const volume = Number(localStorage.getItem('volume') || '50') / 100;

      if (specialNotification && timeDifference === 1) {
        const audio = new Audio(
          `${this.IMAGE_SRC}1mDeadVoices/${item.mobData.mobId}.m4a`,
        );
        audio.volume = volume;
        enqueueAudio(audio);
      } else if (specialNotification && timeDifference === 0) {
        const audio = new Audio(
          `${this.IMAGE_SRC}deadVoices/${item.mobData.mobId}.m4a`,
        );
        audio.volume = volume;
        enqueueAudio(audio);
      } else {
        const audio = new Audio('../../../assets/audio/notification.mp3');
        audio.volume = volume;
        audio.play();
      }
    };

    const sendNotification = (
      title: string,
      body: string,
      timeDifference: number,
    ) => {
      new Notification(title, {
        body,
        icon: `${this.IMAGE_SRC}${item.mob.image}`,
      });
      playSound(timeDifference);
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      if (item.mobData.respawnTime) {
        const timeDifference =
          moment
            .utc(
              Math.round(
                moment(item.mobData.respawnTime).diff(
                  moment(this.currentProgressTime),
                ) / 1000,
              ) * 1000,
            )
            .valueOf() - 1000;

        minutes.forEach((minute) => {
          if (timeDifference === minute * 60000) {
            sendNotification(
              `${item.mob.mobName} - ${item.mob.location}`,
              this.translateService.instant(
                'TIMER.NOTIFICATIONS.MOB_RESPAWN_SOON',
                {
                  mobName: item.mob.mobName,
                  minute: minute,
                },
              ),
              minute,
            );
          }
        });

        if (timeDifference === 0) {
          sendNotification(
            `${item.mob.mobName} - ${item.mob.location}`,
            item.mob.respawnText ??
              this.translateService.instant(
                'TIMER.NOTIFICATIONS.MOB_ENCOURAGEMENT',
              ),
            timeDifference,
          );
        }
      }
    }
  }

  trackByMobId(index: number, item: ITimerItem): string {
    return item.mobData.mobId;
  }

  trackByAvailableMobId(index: number, mob: IAvailableMob): string {
    return mob._id;
  }

  private calcPercent(item: ITimerItem): number {
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

  startTour() {
    this.tourService.start();
  }

  onClickTimerItem(item: ITimerItem): void {
    if (item.mobData.respawnTime) {
      let data: string = `${this.timerService.duplicatedMobList.includes(item.mobData.mobId) ? `${item.mob.shortName}: ${item.mob.location}` : item.mob.shortName} - ${moment(
        item.mobData.respawnTime,
      ).format('HH:mm:ss')}`;
      this.messageService.create('success', `${data}`);
      navigator.clipboard.writeText(data);
    }
  }

  onFocus(event: Event) {
    const target = event.target as HTMLElement;
    (
      target.closest('.timer-radio-option')?.previousSibling as HTMLElement
    )?.click();
  }

  showHistoryModal(item: ITimerItem): void {
    event?.stopPropagation();
    this.getHistory(item);
  }

  confirmHistoryModal(item: ITimerItem): void {
    item.mob.isHistoryModalVisible = false;
  }

  cancelHistoryModal(item: ITimerItem): void {
    item.mob.isHistoryModalVisible = false;
  }

  getHistory(item: ITimerItem): void {
    this.historyService.isLoading = true;
    item.mob.isHistoryModalVisible = true;
    const lang = localStorage.getItem('language') || 'ru';
    this.historyService
      .getMobHistory(
        this.storageService.getLocalStorage('server'),
        item.mobData.mobId,
        undefined,
        undefined,
        lang,
      )
      .subscribe({
        next: (res) => {
          this.historyListData = res;
          this.historyList = res.data;
          this.historyService.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  showAddModal(): void {
    this.allAddChecked = false;
    this.indeterminate = false;
    this.isAddModalLoading = true;
    this.isAddModalVisible = true;
    const lang = localStorage.getItem('language') || 'ru';
    this.timerService.getAvailableBosses(lang).subscribe({
      next: (res) => {
        this.availableMobList = res
          .map((mob) => ({
            ...mob,
            isExcluded:
              this.addedMobList.includes(mob._id) &&
              this.excludedMobs.includes(mob._id),
          }))
          .filter(
            (availableItem) =>
              !this.timerList.some(
                (timerItem) =>
                  timerItem.mobData.mobId === availableItem._id &&
                  timerItem.mob.location === availableItem.location,
              ),
          );
        this.filteredMobList = [...this.availableMobList];
        this.isAddModalLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cancelAddModal(): void {
    this.isAddModalVisible = false;
    this.addMobList = [];
    this.addSearchValue = '';
  }

  onAddMobs(): void {
    this.isAddOkLoading = true;
    this.timerService.isLoading = true;
    this.currentServer = this.storageService.getLocalStorage('server');
    this.timerService
      .addMobGroup(this.currentServer, this.addMobList)
      .subscribe({
        next: () => {
          this.getAllBosses();
          this.isAddOkLoading = false;
          this.isAddModalVisible = false;
          this.messageService.create(
            'success',
            this.translateService.instant('TIMER.MESSAGE.MOBS_ADDED_SUCCESS'),
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.isAddOkLoading = false;
          this.timerService.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  addSearch(value: string): void {
    this.filteredMobList = value
      ? this.availableMobList.filter((mob) =>
          mob.mobName.toLowerCase().startsWith(value.toLowerCase()),
        )
      : [...this.availableMobList];
  }

  addAllChecked(): void {
    this.indeterminate = false;
    const mobsCheckbox = Array.from(
      document.querySelectorAll<HTMLElement>('.add-mob'),
    );
    if (this.allAddChecked) {
      mobsCheckbox.forEach((item) => {
        if (
          !item
            .querySelector('.ant-checkbox')!
            .classList.contains('ant-checkbox-checked') &&
          !item
            .querySelector('.ant-checkbox')!
            .classList.contains('ant-checkbox-disabled')
        ) {
          item.click();
        }
      });
    } else {
      mobsCheckbox.forEach((item) => {
        if (
          item
            .querySelector('.ant-checkbox')!
            .classList.contains('ant-checkbox-checked')
        ) {
          item.click();
        }
      });
    }
  }

  onChangeCheckbox(event: string[]): void {
    const nonExcludedMobs = this.availableMobList.filter(
      (mob) => !mob.isExcluded,
    );

    if (
      nonExcludedMobs.filter(
        (availableItem) =>
          !event.some((selectedId) => selectedId === availableItem._id),
      ).length
    ) {
      this.allAddChecked = false;
      this.indeterminate = false;

      if (
        nonExcludedMobs.filter(
          (availableItem) =>
            !event.some((selectedId) => selectedId === availableItem._id),
        ).length !== nonExcludedMobs.length
      ) {
        this.indeterminate = true;
      }
    } else if (
      !nonExcludedMobs.filter(
        (availableItem) =>
          !event.some((selectedId) => selectedId === availableItem._id),
      ).length
    ) {
      this.allAddChecked = true;
      this.indeterminate = false;
    }

    this.addMobList = event;
  }

  onCanMembersAddMobsChange(value: boolean) {
    this.canMembersAddMobs = value;
  }

  showInfoModal(item: ITimerItem): void {
    event?.stopPropagation();
    item.mob.isInfoModalVisible = true;
  }

  cancelInfoModal(item: ITimerItem) {
    item.mob.isInfoModalVisible = false;
  }

  showDeleteModal(item: ITimerItem): void {
    event?.stopPropagation();
    this.modalService.confirm({
      nzTitle: this.translateService.instant('TIMER.MODAL.DELETE_TITLE'),
      nzContent: this.translateService.instant('TIMER.MODAL.DELETE_MESSAGE', {
        mobName: item.mob.mobName,
      }),
      nzOkText: this.translateService.instant('COMMON.BUTTONS.YES'),
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onDelete(item),
      nzCancelText: this.translateService.instant('COMMON.BUTTONS.NO'),
    });
  }

  onDelete(item: ITimerItem): void {
    this.timerService.isLoading = true;
    this.timerService
      .deleteMobGroup(
        this.storageService.getLocalStorage('server'),
        item.mobData.mobId,
      )
      .subscribe({
        next: () => {
          this.getAllBosses();
          this.messageService.create(
            'success',
            this.translateService.instant('TIMER.MESSAGE.MOB_DELETED_SUCCESS', {
              mobName: item.mob.mobName,
            }),
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.timerService.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  showDeathModal(item: ITimerItem): void {
    event?.stopPropagation();
    item.mob.isDeathModalVisible = true;
    this.comment = '';
    this.isOnlyComment = false;
    this.currentItem = item;
    this.currentTime = Date.now();
    const time = new Date(this.currentTime);
    this.datePickerTime = new Date(
      time.getFullYear(),
      time.getMonth(),
      time.getDate(),
    );
    this.timePickerTime = new Date();
    this.timePickerTime.setHours(
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      0,
    );
  }

  onTimeChange() {
    const time = new Date(this.datePickerTime!);
    time.setHours(
      this.timePickerTime!.getHours(),
      this.timePickerTime!.getMinutes(),
      this.timePickerTime!.getSeconds(),
      0,
    );
    this.currentTime = time.getTime();
  }

  cancelDeathModal(item: ITimerItem): void {
    item.mob.isDeathModalVisible = false;
    this.isOnlyComment = false;
    this.comment = '';
  }

  confirmDeathModal(item: ITimerItem): void {
    const handleSuccess = (message: string, item: IFullMob) => {
      this.timerService.isLoading = true;
      if (item) {
        this.updateItem(this.timerList, item);
      }
      this.timerService.isLoading = false;
      item.mob.isDeathModalVisible = false;
      item.mob.isDeathOkLoading = false;
      this.isOnlyComment = false;
      this.comment = '';
      this.messageService.create('success', message);
      this.cdr.markForCheck();
    };

    const handleError = (err: HttpErrorResponse) => {
      if (err.status !== 401) {
        item.mob.isDeathOkLoading = false;
      }
      this.cdr.markForCheck();
    };

    const radioActions: Record<string, () => void> = {
      death: () => {
        if (!this.currentItem) return;
        if (
          !this.currentItem.mobData.respawnTime ||
          moment(this.currentTime).valueOf() >
            this.currentItem.mobData.respawnTime
        ) {
          this.timerService
            .setByDeathTime(
              this.currentItem,
              moment(this.currentTime).valueOf(),
              this.comment,
            )
            .subscribe({
              next: (res) => {
                handleSuccess(
                  this.translateService.instant(
                    'TIMER.MESSAGE.RESP_UPDATED_BY_DEATH',
                  ),
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
        if (!this.currentItem) return;
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
              this.comment,
            )
            .subscribe({
              next: (res) =>
                handleSuccess(
                  this.translateService.instant(
                    'TIMER.MESSAGE.RESP_UPDATED_BY_RESPAWN',
                  ),
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
            this.comment,
          )
          .subscribe({
            next: (res) =>
              handleSuccess(
                this.translateService.instant(
                  'TIMER.MESSAGE.RESP_UPDATED_BY_CD',
                  {
                    cooldown: this.cooldown ? this.cooldown : 1,
                  },
                ),
                res,
              ),
            error: (err) => handleError(err),
          }),
    };

    item.mob.isDeathOkLoading = true;

    if (!this.isOnlyComment) {
      const action = radioActions[this.radioValue];
      if (action) {
        action();
      }
    }

    if (this.isOnlyComment && this.currentItem) {
      this.timerService.addComment(this.currentItem, this.comment).subscribe({
        next: (res) =>
          handleSuccess(
            this.translateService.instant('TIMER.MESSAGE.COMMENT_UPDATED'),
            res,
          ),
        error: (err) => handleError(err),
      });
    }
  }

  showConfirmRewriteModal(item: ITimerItem, action: string) {
    const handleSuccess = (message: string, item: IFullMob) => {
      this.timerService.isLoading = true;
      if (item) {
        this.updateItem(this.timerList, item);
      }
      this.timerService.isLoading = false;
      item.mob.isDeathModalVisible = false;
      item.mob.isDeathOkLoading = false;
      this.isOnlyComment = false;
      this.comment = '';
      this.messageService.create('success', message);
      this.cdr.markForCheck();
    };

    const handleError = (err: HttpErrorResponse) => {
      if (err.status !== 401) {
        item.mob.isDeathOkLoading = false;
      }
      this.cdr.markForCheck();
    };

    const handleText = () => {
      if (item.mobData.respawnTime)
        if (action === 'death') {
          if (item.mobData.respawnTime <= item.unixtime) {
            return this.translateService.instant(
              'TIMER.MODAL.DEATH_TIME_OVERWRITE_1',
              {
                mobName: item.mob.mobName,
                respTime: moment(item.mobData.respawnTime).format(
                  'HH:mm:ss (DD/MM/YYYY)',
                ),
                currentTime: moment(this.currentTime).format(
                  'HH:mm:ss (DD/MM/YYYY)',
                ),
              },
            );
          }
          return this.translateService.instant(
            'TIMER.MODAL.DEATH_TIME_OVERWRITE_2',
            {
              mobName: item.mob.mobName,
              respTime: moment(item.mobData.respawnTime).format(
                'HH:mm:ss (DD/MM/YYYY)',
              ),
              currentTime: moment(this.currentTime).format(
                'HH:mm:ss (DD/MM/YYYY)',
              ),
            },
          );
        }

      if (item.mobData.respawnTime)
        if (action === 'respawn') {
          if (item.mobData.respawnTime <= item.unixtime) {
            if (moment(this.currentTime).valueOf() < item.mobData.respawnTime) {
              return this.translateService.instant(
                'TIMER.MODAL.RESPAWN_TIME_OVERWRITE_1',
                {
                  mobName: item.mob.mobName,
                  respTime: moment(item.mobData.respawnTime).format(
                    'HH:mm:ss (DD/MM/YYYY)',
                  ),
                  currentTime: moment(this.currentTime).format(
                    'HH:mm:ss (DD/MM/YYYY)',
                  ),
                },
              );
            }

            if (
              moment(this.currentTime).valueOf() >= item.mobData.respawnTime &&
              moment(this.currentTime).valueOf() <
                item.mobData.respawnTime + item.mob.cooldownTime
            ) {
              return this.translateService.instant(
                'TIMER.MODAL.RESPAWN_TIME_OVERWRITE_2',
                {
                  mobName: item.mob.mobName,
                  respTime: moment(item.mobData.respawnTime).format(
                    'HH:mm:ss (DD/MM/YYYY)',
                  ),
                  nestRespTime: moment(
                    item.mobData.respawnTime + item.mob.cooldownTime,
                  ).format('HH:mm:ss (DD/MM/YYYY)'),
                  currentTime: moment(this.currentTime).format(
                    'HH:mm:ss (DD/MM/YYYY)',
                  ),
                },
              );
            }
          }

          if (item.mobData.respawnTime > item.unixtime) {
            if (
              moment(this.currentTime).valueOf() >= item.mobData.respawnTime
            ) {
              return this.translateService.instant(
                'TIMER.MODAL.NEXT_RESPAWN_TIME_OVERWRITE',
                {
                  mobName: item.mob.mobName,
                  respTime: moment(item.mobData.respawnTime).format(
                    'HH:mm:ss (DD/MM/YYYY)',
                  ),
                  currentTime: moment(this.currentTime).format(
                    'HH:mm:ss (DD/MM/YYYY)',
                  ),
                },
              );
            }

            if (moment(this.currentTime).valueOf() < item.mobData.respawnTime) {
              return this.translateService.instant(
                'TIMER.MODAL.RESPAWN_TIME_NEXT_PROTECTED',
                {
                  mobName: item.mob.mobName,
                  respTime: moment(item.mobData.respawnTime).format(
                    'HH:mm:ss (DD/MM/YYYY)',
                  ),
                  currentTime: moment(this.currentTime).format(
                    'HH:mm:ss (DD/MM/YYYY)',
                  ),
                },
              );
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
      nzTitle: this.translateService.instant('TIMER.MODAL.REWRITE_TITLE'),
      nzContent: handleText(),
      nzCentered: true,
      nzOkText: this.translateService.instant('COMMON.BUTTONS.YES'),
      nzOnOk: () => {
        if (action === 'death') {
          this.timerService
            .setByDeathTime(
              item,
              moment(this.currentTime).valueOf(),
              this.comment,
            )
            .subscribe({
              next: (res) =>
                handleSuccess(
                  this.translateService.instant(
                    'TIMER.MESSAGE.RESP_UPDATED_BY_DEATH',
                  ),
                  res,
                ),
              error: (err) => handleError(err),
            });
        }

        if (action === 'respawn') {
          this.timerService
            .setByRespawnTime(
              item,
              moment(this.currentTime).valueOf(),
              this.comment,
            )
            .subscribe({
              next: (res) =>
                handleSuccess(
                  this.translateService.instant(
                    'TIMER.MESSAGE.RESP_UPDATED_BY_RESPAWN',
                  ),
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
              this.comment,
            )
            .subscribe({
              next: (res) =>
                handleSuccess(
                  this.translateService.instant(
                    'TIMER.MESSAGE.RESP_UPDATED_BY_CD',
                    {
                      cooldown: this.cooldown ? this.cooldown : 1,
                    },
                  ),
                  res,
                ),
              error: (err) => handleError(err),
            });
        }
      },
      nzCancelText: this.translateService.instant('COMMON.BUTTONS.NO'),
      nzOnCancel: () => {
        item.mob.isDeathOkLoading = false;
        item.mob.isOnDieNow = false;
        this.cdr.markForCheck();
      },
    });
  }

  onDieNow(item: ITimerItem): void {
    event?.stopPropagation();
    item.mob.isOnDieNow = true;
    this.currentTime = Date.now() - 10000;
    if (!item.mobData.respawnTime || Date.now() > item.mobData.respawnTime) {
      this.timerService.isLoading = true;
      this.timerService.getUnixtime().subscribe({
        next: (res) => {
          this.currentTime = res ? res.unixtime : Date.now();
          this.timerService
            .setByDeathTime(item, this.currentTime - 10000, '')
            .subscribe({
              next: (res: IFullMob) => {
                this.updateItem(this.timerList, res);
                this.timerService.isLoading = false;
                this.messageService.create(
                  'success',
                  this.translateService.instant('TIMER.MESSAGE.RESP_REWRITTEN'),
                );
                item.mob.isOnDieNow = false;
                this.cdr.markForCheck();
              },
            });
        },
        error: () => {
          this.timerService.isLoading = false;
          item.mob.isOnDieNow = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.timerService.getUnixtime().subscribe({
        next: (res) => {
          this.currentTime = res ? res.unixtime - 10000 : Date.now() - 10000;
          this.showConfirmRewriteModal(item, 'death');
          this.cdr.markForCheck();
        },
        error: () => {
          this.timerService.isLoading = false;
          item.mob.isOnDieNow = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  onPlusCooldown(item: ITimerItem): void {
    event?.stopPropagation();
    item.mob.plusCooldown++;
    if (item.mobData.respawnTime) {
      item.mobData.respawnTime += item.mob.cooldownTime;
    }
  }

  onSetByCooldownTime(item: ITimerItem): void {
    event?.stopPropagation();
    this.timerService.isLoading = true;
    this.timerService.setByCooldownTime(item, 1, '').subscribe({
      next: (res: IFullMob) => {
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
          this.translateService.instant('TIMER.MESSAGE.RESP_REWRITTEN_BY_CD'),
        );
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.create(
          'error',
          this.translateService.instant('TIMER.MESSAGE.RESP_LOST'),
        );
        this.timerService.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onLostCooldown(item: ITimerItem): void {
    event?.stopPropagation();
    this.timerService.isLoading = true;
    this.timerService.respawnLost(item).subscribe({
      next: (res: IFullMob) => {
        // if (item.timeoutId) {
        //   clearTimeout(item.timeoutId);
        //   item.isTimerRunning = false;
        // }
        if (res) {
          this.updateItem(this.timerList, res);
        }
        this.timerService.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.timerService.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getAllBosses(): void {
    const lang = localStorage.getItem('language') || 'ru';
    this.currentServer = this.storageService.getLocalStorage('server');
    this.timerService.getAllBosses(this.currentServer, lang).subscribe({
      next: (res) => {
        this.addedMobList = res.map((item) => item.mob._id);
        this.currentTime = res.length ? res[0].unixtime : Date.now();
        this.currentProgressTime = res.length ? res[0].unixtime : Date.now();
        const filteredRes = this.timerService.filterExcludedMobs(
          res,
          this.userService.currentExcludedMobs,
        );

        this.sortTimerList([...filteredRes]);

        this.timerService.timerList = this.timerList;

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
        this.cdr.markForCheck();
      },
      error: () => {
        this.timerService.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  refreshBosses(): void {
    this.getAllBosses();
  }

  getCurrentUser() {
    this.timerService.isLoading = true;
    this.userService.getUser().subscribe({
      next: (res) => {
        this.userGroupName = res.groupName || '';
        this.timerService.groupName = this.userGroupName;
        this.excludedMobs = res.excludedMobs || [];
        this.userService.excludedMobs = this.excludedMobs;
        if (res.groupName) {
          this.groupsService.getGroup().subscribe({
            next: (res) => {
              this.canMembersAddMobs = res.canMembersAddMobs;
              this.groupLeaderEmail = res.groupLeader;
              res.members.map((member: string) => {
                let nickname: string = member.split(': ')[0];
                let email: string = member.split(': ')[1];
                this.userGroupList.push({ nickname, email });
              });
              this.userGroupList.forEach((item, i) => {
                item.id = i;
              });
              this.cdr.markForCheck();
            },
          });
        }
        this.userService.currentUser = res;
        this.userService.currentUser$.subscribe({
          next: (res) => {
            this.currentUser = res;
            this.cdr.markForCheck();
          },
        });
        if (!this.isInitialized) {
          this.getAllBosses();
          this.isInitialized = true;
        }
        this.cdr.markForCheck();
      },
    });
  }

  onGroupValueChange(event: string) {
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
    this.groupModalName = this.translateService.instant(
      'TIMER.MODAL.CREATE_GROUP_TITLE',
    );
    this.groupModalPlaceholder = this.translateService.instant(
      'TIMER.MODAL.CREATE_GROUP_PLACEHOLDER',
    );
    this.groupOkButton = this.translateService.instant('COMMON.BUTTONS.CREATE');
    this.groupModalMode = 'create';
  }

  showJoinGroupModal() {
    this.groupInputValue = '';
    this.isJoinGroupLoading = true;
    this.isGroupModalVisible = true;
    this.groupModalName = this.translateService.instant(
      'TIMER.MODAL.JOIN_GROUP_TITLE',
    );
    this.groupModalPlaceholder = this.translateService.instant(
      'TIMER.MODAL.JOIN_GROUP_PLACEHOLDER',
    );
    this.groupOkButton = this.translateService.instant('COMMON.BUTTONS.JOIN');
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

  onExchangeRefresh(): void {
    this.exchangeRefresh(() => {
      this.isInitialized = false;
      this.getCurrentUser();
    });
  }

  showNotifications(index: number): void {
    // this.notificationService.getNotifications().subscribe({
    //   next: (res) => {
    //     this.notificationService.notificationList = res.reverse();

    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }

    this.notificationsSubscription =
      this.notificationService.notificationList$.subscribe({
        next: (res) => {
          this.notifications = res;

          if (this.notifications[index]) {
            this.nzNotificationService.template(this.template!, {
              nzKey: 'key',
              nzData: { ...this.notifications[index], index },
              nzPlacement: this.position,
              nzDuration: 0,
            });
          }
          this.cdr.markForCheck();
        },
      });
    // },
    // });
  }

  previousNotification(index: number) {
    if (index > 0) {
      this.currentNotificationIndex = index - 1;
      if (this.notifications[this.currentNotificationIndex]) {
        this.nzNotificationService.template(this.template!, {
          nzKey: 'key',
          nzData: {
            ...this.notifications[this.currentNotificationIndex],
            index: this.currentNotificationIndex,
          },
          nzPlacement: this.position,
          nzDuration: 0,
        });
      }
      this.cdr.markForCheck();
    }
  }

  nextNotification(index: number) {
    if (index + 1 < this.notifications.length) {
      this.currentNotificationIndex = index + 1;
      if (this.notifications[this.currentNotificationIndex]) {
        this.nzNotificationService.template(this.template!, {
          nzKey: 'key',
          nzData: {
            ...this.notifications[this.currentNotificationIndex],
            index: this.currentNotificationIndex,
          },
          nzPlacement: this.position,
          nzDuration: 0,
        });
      }
      this.cdr.markForCheck();
    }
  }

  private onCreateGroup(name: string) {
    this.selectedSegments = 0;
    this.groupsService.createGroup(name).subscribe({
      next: () => {
        this.exchangeRefresh(() => {
          this.isCreateGroupLoading = false;
          this.isInitialized = false;
          this.getCurrentUser();
        });
      },
      error: () => {
        this.isGroupModalLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private onJoinGroup(code: string) {
    this.selectedSegments = 0;
    this.groupsService.joinGroup(code).subscribe({
      next: () => {
        this.exchangeRefresh(() => {
          this.isJoinGroupLoading = false;
          this.isInitialized = false;
          this.getCurrentUser();
        });
      },
      error: () => {
        this.isGroupModalLoading = false;
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (err.status === 401) {
          this.onLogout();
        }
        this.cdr.markForCheck();
      },
    });
  }

  private onLogout(): void {
    this.authService.logout();
  }
}
