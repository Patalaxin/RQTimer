import { Component, HostListener, inject, Input, OnInit } from '@angular/core';
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

  @Input() historyList: any;
  @Input() historyListData: any;
  @Input() mobName: string = '';

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

  changePage($event: any, mobName: string): void {
    this.isLoading = true;
    this.historyService
      .getHistory(
        this.storageService.getLocalStorage('server'),
        mobName,
        Number($event),
        Number(this.pageSize),
      )
      .subscribe({
        next: (res: any) => {
          this.page = $event;
          this.historyList = res.data;
          this.isLoading = false;
        },
      });
  }

  changePageSize($event: any, mobName: string): void {
    this.isLoading = true;
    this.historyService
      .getHistory(
        this.storageService.getLocalStorage('server'),
        mobName,
        1,
        Number($event),
      )
      .subscribe({
        next: (res: any) => {
          this.pageSize = $event;
          this.changePage(1, mobName);
          this.historyList = res.data;
          this.isLoading = false;
        },
      });
  }

  getInputMethod(item: any): string {
    const methods: { [key: string]: string } = {
      updateMobByCooldown: `по кд ${item.toCooldown - item.fromCooldown} раз`,
      updateMobDateOfDeath: 'по точному времени смерти',
      updateMobDateOfRespawn: 'по точному времени респауна',
      crashMobServer: 'всех боссов/элиток из-за краша сервера',
      respawnLost: 'как утерянный респаун',
    };

    return methods[item.historyTypes] || 'по тупому';
  }
}
