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

import { AuthService } from 'src/app/services/auth.service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form: FormGroup = new FormGroup({
    key: new FormControl(''),
    password: new FormControl(''),
  });
  submitted: boolean = false;
  passwordVisible: boolean = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private storageService: StorageService,
    private message: NzMessageService
  ) {}

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  onLogin(): void {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.authService
      .login(this.form.value.key, this.form.value.password)
      .subscribe({
        next: (res) => {
          console.log('authService', res);
          this.storageService.setSessionStorage(
            this.form.value.key,
            res.accessToken
          );
          if (res.accessToken) {
            this.router.navigate(['/timer']);
          }
        },
        error: (err) => {
          this.message.create('error', 'Неверный логин или пароль');
        },
      });
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      key: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]],
    });
  }
}
