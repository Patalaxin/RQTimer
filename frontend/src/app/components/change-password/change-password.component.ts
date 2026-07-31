import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { OtpChangeEvent } from 'ngx-otp-input';
import { OtpService } from 'src/app/services/otp.service';
import { UserService } from 'src/app/services/user.service';
import Validation from 'src/app/utils/validation';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  standalone: false,
})
export class ChangePasswordComponent {
  private readonly router = inject(Router);
  private readonly otpService = inject(OtpService);
  private readonly userService = inject(UserService);
  private readonly translateService = inject(TranslateService);
  private readonly messageService = inject(NzMessageService);

  isModalVisible: boolean = false;
  isModalLoading: boolean = false;

  otpLength: number = 5;

  isVerifyDisabled: boolean = true;

  otpTimer: number = 60;
  otpComplete: string = '';
  otpInterval: ReturnType<typeof setInterval> | undefined;

  form: FormGroup = new FormGroup(
    {
      email: new FormControl('', [Validators.required, Validators.email]),
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(64),
        Validation.passwordValidator,
        // Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,64}$/),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    {
      validators: [Validation.match('newPassword', 'confirmPassword')],
    },
  );
  submitted: boolean = false;
  passwordVisible: boolean = false;
  passwordChangeLoading: boolean = false;

  get formControls(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  onSendOTP(): void {
    // this.showModal();
    this.passwordChangeLoading = true;
    this.otpService.sendOTP(this.form.value['email']).subscribe({
      next: () => {
        this.showModal();
      },
      error: () => {
        this.passwordChangeLoading = false;
      },
    });
  }

  showModal(): void {
    event?.stopPropagation();
    this.isModalVisible = true;
    clearInterval(this.otpInterval);
    this.otpTimer = 60;
    this.otpInterval = setInterval(() => {
      if (this.otpTimer > 0) {
        this.otpTimer--;
      }
    }, 1000);
  }

  cancelModal(): void {
    clearInterval(this.otpInterval);
    this.passwordChangeLoading = false;
    this.isModalVisible = false;
  }

  onChangeOTP(event: OtpChangeEvent): void {
    this.isVerifyDisabled = !event.isComplete;
  }

  onCompleteOTP(event: string): void {
    this.otpComplete = event;
  }

  onVerifyOTP(): void {
    this.isModalLoading = true;
    this.otpService
      .verifyOTP(this.form.value['email'], this.otpComplete)
      .subscribe({
        next: () => {
          this.onChangePassword();
        },
        error: () => {
          this.isModalLoading = false;
        },
      });
  }

  onChangePassword() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.userService
      .forgotPassword(this.form.value.email, this.form.value.newPassword)
      .subscribe({
        next: (res) => {
          this.passwordChangeLoading = false;
          if (res.message === 'Password successfully changed') {
            this.messageService.create(
              'success',
              this.translateService.instant(
                'CHANGE_PASSWORD.MESSAGE.PASSWORD_CHANGED_SUCCESSFULLY',
              ),
            );
            this.router.navigate(['/login']);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.passwordChangeLoading = false;
          if (err.error?.message) {
            return this.messageService.create('error', err.error.message);
          }
          return this.messageService.create(
            'error',
            this.translateService.instant(
              'CHANGE_PASSWORD.MESSAGE.UNKNOWN_ERROR',
            ),
          );
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/login']);
  }
}
