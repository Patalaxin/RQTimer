import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { HistoryService } from 'src/app/services/history.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {
  historyList: any = [];
  isLoading = this.historyService.isLoading;

  user = {
    nickname: '',
    email: '',
    role: '',
  };

  constructor(
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

        this.getHistory(this.storageService.getSessionStorage('server'));
      },
      error: (err) => {
        console.log('getUser error', err);
        if (err.status === 401) {
          if (retryCount > 0) {
            this.exchangeRefresh();
            this.getUser(--retryCount);
          }
        }
      },
    });
  }

  getHistory(server: string): void {
    this.historyService.getHistory(server).subscribe({
      next: (res: any) => {
        this.historyList = res.data;
        this.historyList = this.historyList.reverse();
        this.historyService.setIsLoading(false);
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
    this.getUser(1);
    this.historyService.historyList.subscribe({
      next: (res) => {
        this.historyList = res;
        console.log('history', this.historyList);
      },
    });
  }
}
