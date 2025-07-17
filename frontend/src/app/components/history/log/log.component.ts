import { Component, HostListener, inject, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HistoryService } from 'src/app/services/history.service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss'],
})
export class LogComponent implements OnInit {
  private readonly historyService = inject(HistoryService);
  private readonly storageService = inject(StorageService);
  private readonly translateService = inject(TranslateService);

  @Input() historyList: any;
  @Input() historyListData: any;
  @Input() mobId: string = '';

  pageSize: number = 10;
  page: number = 1;

  isLoading: boolean = false;
  isScreenWidth550: boolean = false;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenWidth();
  }

  ngOnInit(): void {
    this.checkScreenWidth();
  }

  private checkScreenWidth(): void {
    this.isScreenWidth550 = window.innerWidth <= 550;
  }

  getUserColor(role: string): any {
    return role == 'Admin' ? 'volcano' : 'lime';
  }

  changePage($event: any, mobId: string): void {
    this.isLoading = true;
    const lang = localStorage.getItem('language') || 'ru';
    if (mobId) {
      this.historyService
        .getMobHistory(
          this.storageService.getLocalStorage('server'),
          mobId,
          Number($event),
          Number(this.pageSize),
          lang,
        )
        .subscribe({
          next: (res: any) => {
            this.page = $event;
            this.historyList = res.data;
            this.isLoading = false;
          },
        });
    }

    if (!mobId) {
      this.historyService
        .getHistory(
          this.storageService.getLocalStorage('server'),
          Number($event),
          Number(this.pageSize),
          lang,
        )
        .subscribe({
          next: (res: any) => {
            this.page = $event;
            this.historyList = res.data;
            this.isLoading = false;
          },
        });
    }
  }

  changePageSize($event: any, mobId: string): void {
    this.isLoading = true;
    const lang = localStorage.getItem('language') || 'ru';
    if (mobId) {
      this.historyService
        .getMobHistory(
          this.storageService.getLocalStorage('server'),
          mobId,
          1,
          Number($event),
          lang,
        )
        .subscribe({
          next: (res: any) => {
            this.pageSize = $event;
            this.changePage(1, mobId);
            this.historyList = res.data;
            this.isLoading = false;
          },
        });
    }

    if (!mobId) {
      this.historyService
        .getHistory(
          this.storageService.getLocalStorage('server'),
          1,
          Number($event),
          lang,
        )
        .subscribe({
          next: (res: any) => {
            this.pageSize = $event;
            this.changePage(1, mobId);
            this.historyList = res.data;
            this.isLoading = false;
          },
        });
    }
  }

  getInputMethod(item: any): string {
    const methods: { [key: string]: string } = {
      updateMobByCooldown: this.translateService.instant('LOG.COOLDOWN_COUNT', {
        count: item.toCooldown - item.fromCooldown,
      }),
      updateMobDateOfDeath: this.translateService.instant(
        'LOG.EXACT_DEATH_TIME',
      ),
      updateMobDateOfRespawn: this.translateService.instant(
        'LOG.EXACT_RESPAWN_TIME',
      ),
      crashMobServer: this.translateService.instant('LOG.SERVER_CRASH'),
      respawnLost: this.translateService.instant('LOG.LOST_RESPAWN'),
    };

    return (
      methods[item.historyTypes] ||
      this.translateService.instant('LOG.DUMB_METHOD')
    );
  }
}
