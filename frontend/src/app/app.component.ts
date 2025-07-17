import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TimerService } from './services/timer.service';
import {
  NzNotificationPlacement,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NotificationService } from './services/notification.service';
import { StorageService } from './services/storage.service';
import { TranslateService } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, AfterViewChecked {
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly timerService = inject(TimerService);
  private readonly notificationService = inject(NotificationService);
  private readonly storageService = inject(StorageService);
  private readonly nzNotificationService = inject(NzNotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('notificationTemplate', { static: false })
  template?: TemplateRef<{}>;

  title = 'rq-timer-fe';
  notifications: any[] = [];
  currentNotificationIndex: number = 0;
  position: NzNotificationPlacement | undefined = 'bottomRight';
  showBackground: boolean = false;
  isVisible: boolean = false;
  language: string = 'ru';

  cyrillicLanguages = [
    'ru', // Русский
    'uk', // Украинский
    'be', // Белорусский
    'kk', // Казахский
    'ky', // Киргизский
    'tg', // Таджикский
    'uz', // Узбекский
    'tk', // Туркменский
    'ab', // Абхазский
    'hy', // Армянский
    'az', // Азербайджанский
    'mo', // Молдавский
  ];

  ngOnInit() {
    this.setMeta();

    // Обновляем мета-теги при смене языка
    this.translateService.onLangChange.subscribe(() => {
      this.setMeta();
    });

    // Инициализация языков
    this.translateService.addLangs(['ru', 'en', 'vi', 'pl']);

    // Используем язык из localStorage или дефолтный
    const savedLang = localStorage.getItem('language');
    const browserLang = navigator.language.toLowerCase();

    const isCyrillicLang = this.cyrillicLanguages.some((code) =>
      browserLang.startsWith(code),
    );

    const defaultLang = isCyrillicLang ? 'ru' : 'en';

    if (!savedLang) localStorage.setItem('language', defaultLang);

    this.language = savedLang || defaultLang;

    this.translateService.setDefaultLang(defaultLang);
    this.translateService.use(savedLang || defaultLang);

    this.currentNotificationIndex = 0;
    this.timerService.telegramBotVisibility = true;

    this.timerService.headerVisibility$.subscribe({
      next: (res) => {
        this.isVisible = res;
      },
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkRoute(event.urlAfterRedirects);
      });
  }

  ngAfterViewInit(): void {
    this.showNotifications(this.currentNotificationIndex);
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges(); // Применяем изменения после всех проверок
  }

  checkRoute(url: string) {
    // Проверяем текущий маршрут и задаем значение для showBackground
    this.showBackground = url === '/timer';
  }

  setMeta() {
    this.translateService.get('APP.TITLE').subscribe((title: string) => {
      this.titleService.setTitle(title);
    });
    this.translateService.get('APP.DESCRIPTION').subscribe((desc: string) => {
      this.metaService.updateTag({ name: 'description', content: desc });
    });
  }

  showNotifications(index: number): void {
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.notificationService.notificationList = res.reverse();
        this.notifications = res.filter((item: any) => {
          const viewed = this.storageService.getLocalStorage('notification');
          const viewedArr: string[] = viewed ? JSON.parse(viewed) : [];
          return !viewedArr.includes(item.id);
        });

        if (this.notifications[index]) {
          this.nzNotificationService
            .template(this.template!, {
              nzKey: 'key',
              nzData: { ...this.notifications[index], index },
              nzPlacement: this.position,
              nzDuration: 0,
            })
            .onClose.subscribe({
              next: (res) => {
                if (res) {
                  this.notifications.map((item) => {
                    this.storageService.setViewedNotifications(item.id);
                  });
                }
              },
            });

          this.storageService.setViewedNotifications(
            this.notifications[index].id,
          );
        }
      },
    });
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
    }
  }

  nextNotification(index: number) {
    this.storageService.setViewedNotifications(
      this.notifications[index + 1].id,
    );

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
    }
  }
}
