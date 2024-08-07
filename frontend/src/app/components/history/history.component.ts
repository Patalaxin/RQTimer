import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  historyList: any = [];
  historyListData: any = [];
  isLoading = this.historyService.isLoading;

  user = {
    nickname: '',
    email: '',
    role: '',
  };

  constructor(
    private router: Router,
    private timerService: TimerService,
    private authService: AuthService,
    private userService: UserService,
    private storageService: StorageService,
    private historyService: HistoryService
  ) {}

  getUser(retryCount: number) {
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
      error: (err) => {
        console.log('getUser error', err);
        if (err.status === 401) {
          if (retryCount > 0) {
            this.exchangeRefresh();
            this.getUser(--retryCount);
          }
          this.onLogout();
        }
      },
    });
  }

  onLogout(): void {
    this.authService.signOut().subscribe({
      next: (res) => {
        this.storageService.clean();
        this.router.navigate(['/login']);
      },
    });
  }

  getHistory(server: string): void {
    this.historyService.getHistory(server).subscribe({
      next: (res: any) => {
        this.historyListData = res;
        this.historyList = res.data;
        this.historyService.setIsLoading(false);
      },
    });
  }

  onTimer(): void {
    this.timerService.setIsLoading(true);
    this.router.navigate(['/timer']);
  }

  onBack(e: Event): void {
    (
      (e.target as HTMLElement)
        .closest('div')
        ?.querySelector('.ant-page-header-back') as HTMLElement
    ).click();
  }

  private exchangeRefresh() {
    let key =
      Object.keys(this.storageService.getLocalStorage('email')).length === 0
        ? this.storageService.getLocalStorage('nickname')
        : this.storageService.getLocalStorage('email');
    this.authService.exchangeRefresh(key).subscribe({
      next: (res) => {
        console.log('exchangeRefresh', res);
        this.storageService.setLocalStorage(key, res.accessToken);
      },
    });
  }

  ngOnInit(): void {
    this.getUser(1);
    this.historyService.historyList.subscribe({
      next: (res) => {
        this.historyList = res;
        console.log('history', this.historyList);
      },
    });

    this.historyService.historyListData.subscribe({
      next: (res) => {
        this.historyListData = res;
      },
    });
  }
}
