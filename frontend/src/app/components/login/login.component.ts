import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
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
  private router = inject(Router);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private messageService = inject(NzMessageService);

  form: FormGroup = new FormGroup({
    key: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
    ]),
  });
  submitted: boolean = false;
  passwordVisible: boolean = false;

  isLoginLoading: boolean = false;

  ngOnInit(): void {
    // this.getServers();
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
            res.accessToken
          );
          if (res.accessToken) {
            this.router.navigate(['/timer']);
          }
        },
        error: (err) => {
          this.isLoginLoading = false;
          this.messageService.create('error', 'Неверный логин или пароль');
        },
      });
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
