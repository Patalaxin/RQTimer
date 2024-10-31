import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from 'src/app/services/auth.service';
import { HistoryService } from 'src/app/services/history.service';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly timerService = inject(TimerService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly storageService = inject(StorageService);
  private readonly historyService = inject(HistoryService);
  private readonly messageService = inject(NzMessageService);

  historyList: any = [];
  historyListData: any = [];
  isLoading = this.historyService.isLoading$;

  user = {
    nickname: '',
    email: '',
    role: '',
  };

  ngOnInit(): void {
    this.timerService.headerVisibility = true;
    this.getUser();
    this.historyService.historyList$.subscribe({
      next: (res) => {
        this.historyList = res;
        console.log('history', this.historyList);
      },
    });

    this.historyService.historyListData$.subscribe({
      next: (res) => {
        this.historyListData = res;
      },
    });
  }

  getUser() {
    this.userService.getUser().subscribe({
      next: (res) => {
        console.log('getUser', res);
        this.user = {
          nickname: res.nickname,
          email: res.email,
          role: res.role,
        };

        this.getHistory(this.storageService.getLocalStorage('server'));
      },
    });
  }

  getHistory(server: string): void {
    this.historyService.getHistory(server).subscribe({
      next: (res: any) => {
        this.historyListData = res;
        this.historyList = res.data;
        this.historyService.isLoading = false;
      },
      error: () => {
        this.historyService.isLoading = false;
      },
    });
  }

  onTimer(): void {
    this.timerService.isLoading = true;
    this.router.navigate(['/timer']);
  }

  onBack(e: Event): void {
    (
      (e.target as HTMLElement)
        .closest('div')
        ?.querySelector('.ant-page-header-back') as HTMLElement
    ).click();
  }
}
