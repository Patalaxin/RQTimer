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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, AfterViewChecked {
  private readonly router = inject(Router);
  private readonly timerService = inject(TimerService);
  private readonly notificationService = inject(NotificationService);
  private readonly storageService = inject(StorageService);
  private readonly nzNotificationService = inject(NzNotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('notificationTemplate', { static: false })
  template?: TemplateRef<{}>;

  title = 'rq-timer-fe';
  notifications: any[] = [];
  currentNotificationIndex: number = 0;
  position: NzNotificationPlacement | undefined = 'bottomRight';
  showBackground: boolean = false;
  isVisible: boolean = false;

  ngOnInit() {
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
