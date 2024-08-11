import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private router = inject(Router);
  private timerService = inject(TimerService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private storageService = inject(StorageService);

  user = {
    nickname: '',
    email: '',
    role: '',
  };

  excludedMobs = [];
  isLoading: boolean = true;

  ngOnInit(): void {
    this.getUser();
  }

  getUser() {
    this.userService.getUser().subscribe({
      next: (res) => {
        this.userService.currentUser = res;
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
        if (err.status === 401) {
          this.exchangeRefresh();
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

  private exchangeRefresh() {
    let key = !this.storageService.getLocalStorage('email')
      ? this.storageService.getLocalStorage('nickname')
      : this.storageService.getLocalStorage('email');
    this.authService.exchangeRefresh(key).subscribe({
      next: (res) => {
        console.log('exchangeRefresh', res);
        this.storageService.setLocalStorage(key, res.accessToken);
        this.getUser();
      },
      error: (err) => {
        if (err.status === 401) {
          this.onLogout();
        }
      },
    });
  }
}
