import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
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
  private readonly router = inject(Router);
  private readonly timerService = inject(TimerService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly storageService = inject(StorageService);
  private readonly messageService = inject(NzMessageService);

  user = {
    nickname: '',
    email: '',
    role: '',
  };

  excludedMobs = [];
  isLoading: boolean = true;

  ngOnInit(): void {
    this.timerService.headerVisibility = true;
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
