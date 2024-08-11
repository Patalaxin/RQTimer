import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserService } from 'src/app/services/user.service';
import Validation from 'src/app/utils/validtion';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent {
  private router = inject(Router);
  private userService = inject(UserService);
  private messageService = inject(NzMessageService);

  form: FormGroup = new FormGroup(
    {
      email: new FormControl('', [Validators.required, Validators.email]),
      sessionId: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    {
      validators: [Validation.match('newPassword', 'confirmPassword')],
    }
  );
  submitted: boolean = false;
  passwordVisible: boolean = false;

  get formControls(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  onChangePassword() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.userService
      .forgotPassword(
        this.form.value.email,
        this.form.value.sessionId,
        this.form.value.newPassword
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          if (res.message === 'Password successfully changed') {
            this.messageService.create('success', 'Пароль успешно изменён');
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          this.messageService.create(
            'error',
            'Ошибка, обратитесь к создателям таймера'
          );
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/login']);
  }
}
