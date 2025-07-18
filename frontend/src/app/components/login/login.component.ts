import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AuthService } from 'src/app/services/auth.service';
import { TimerService } from 'src/app/services/timer.service';
import { StorageService } from 'src/app/services/storage.service';
import * as moment from 'moment';
import { UserService } from 'src/app/services/user.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly timerService = inject(TimerService);
  private readonly userService = inject(UserService);
  private readonly storageService = inject(StorageService);
  private readonly translateService = inject(TranslateService);
  private readonly messageService = inject(NzMessageService);

  form: FormGroup = new FormGroup({
    key: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required]),
  });
  submitted: boolean = false;
  passwordVisible: boolean = false;

  isLoginLoading: boolean = false;

  isGuideLoading: boolean = false;
  isGuideVisible: boolean = false;

  isVisible: boolean = false;

  images: any[] = [
    {
      name: 'lesta',
      src: '../../../assets/img/lesta-banner.avif',
      link: 'https://baseplatform.online/royalquest',
    },
    {
      name: 'rqcalc',
      src: '../../../assets/img/rqcalc-banner.avif',
      link: 'https://www.dropbox.com/scl/fi/1b5ansnztahmuzkhyovtb/RqCalcWPF.7z?rlkey=4wm5tninqzbyo8tsggvffroq8&e=2&st=t40n87c5&dl=0',
    },
    {
      name: 'rqwiki',
      src: '../../../assets/img/rqwiki-banner.avif',
      link: 'https://royalquest.info/index.php/%D0%97%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F_%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0',
    },
  ];

  ngOnInit(): void {
    // this.getServers();
    this.timerService.telegramBotVisibility$.subscribe({
      next: (res) => {
        this.isVisible = res;
      },
    });
  }

  get formControls(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  onLogin(): void {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.isLoginLoading = true;

    this.authService
      .login(this.form.value.key, this.form.value.password)
      .subscribe({
        next: (res) => {
          this.storageService.setLocalStorage(
            this.form.value.key,
            res.accessToken,
          );
          if (res.accessToken) {
            let userTimezone = moment.tz.guess();

            if (window.localStorage.getItem('timezone')) {
              if (window.localStorage.getItem('timezone') !== userTimezone) {
                window.localStorage.setItem('timezone', userTimezone);
                this.userService.setUserTimezone(userTimezone).subscribe();
              }
            }

            if (!window.localStorage.getItem('timezone')) {
              window.localStorage.setItem('timezone', userTimezone);
              this.userService.setUserTimezone(userTimezone).subscribe();
            }

            this.router.navigate(['/timer']);
          }
        },
        error: () => {
          this.isLoginLoading = false;
          this.messageService.create(
            'error',
            this.translateService.instant(
              'LOGIN.MESSAGE.INVALID_LOGIN_OR_PASSWORD',
            ),
          );
        },
      });
  }

  showGuideModal(): void {
    this.isGuideLoading = true;
    this.isGuideVisible = true;
  }

  cancelGuideModal(): void {
    this.isGuideLoading = false;
    this.isGuideVisible = false;
  }

  // getServers(): void {
  //   this.configurationService.getServers().subscribe({
  //     next: (res) => {
  //       let serverList: any[] = [];
  //       res.map((server: any) => {
  //         serverList.push({ label: server, value: server });
  //       });
  //       this.configurationService.setServerList(serverList);
  //     },
  //   });
  // }
}
