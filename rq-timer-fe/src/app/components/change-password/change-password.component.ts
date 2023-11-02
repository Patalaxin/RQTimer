import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit {
  form: FormGroup = new FormGroup({
    email: new FormControl(''),
    sessionId: new FormControl(''),
    newPassword: new FormControl(''),
  });
  submitted: boolean = false;
  passwordVisible: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router,
    private message: NzMessageService
  ) {}

  get f(): { [key: string]: AbstractControl } {
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
            this.message.create('success', 'Пароль успешно изменён');
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          this.message.create(
            'error',
            'Ошибка, обратитесь к создателям таймера'
          );
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      sessionId: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(3)]],
    });
  }
}
