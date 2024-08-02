import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user = {
    nickname: '',
    email: '',
    role: '',
  };

  excludedMobs = [];
  isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private storageService: StorageService
  ) {}

  getUser(retryCount: number) {
    this.userService.getUser().subscribe({
      next: (res) => {
        this.userService.setCurrentUser(res);
        console.log('getUser', res);
        this.user = {
          nickname: res.nickname,
          email: res.email,
          role: res.role,
        };

        this.excludedMobs = res.excludedMobs;

        this.isLoading = false;
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
  }
}
