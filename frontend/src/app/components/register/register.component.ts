import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { UserService } from 'src/app/services/user.service';
import Validation from 'src/app/utils/validation';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly configurationService = inject(ConfigurationService);
  private readonly messageService = inject(NzMessageService);

  currentStep: number = 0;

  selectedBossesCheckbox: string[] = [];
  selectedElitesCheckbox: string[] = [];

  bossesCheckboxList: any;
  elitesCheckboxList: any;

  form: FormGroup = new FormGroup(
    {
      nickname: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
      ]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(64),
        Validation.passwordValidator,
        // Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,64}$/),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
      sessionId: new FormControl('', [Validators.required]),
      excludedBosses: new FormArray([]),
      excludedElites: new FormArray([]),
    },
    {
      validators: [Validation.match('password', 'confirmPassword')],
    },
  );
  submitted: boolean = false;
  passwordVisible: boolean = false;

  ngOnInit(): void {
    this.getMobs();
  }

  private addCheckbox(checkboxList: any[], control: FormArray): void {
    checkboxList.forEach(() => {
      control.push(new FormControl());
    });
  }

  prev(): void {
    this.currentStep--;
  }

  next(): void {
    this.currentStep++;
  }

  done(): void {
    this.onRegister();
    console.log('done');
  }

  get formControls(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  get excludedBosses() {
    return this.form.controls['excludedBosses'] as FormArray;
  }

  get excludedElites() {
    return this.form.controls['excludedElites'] as FormArray;
  }

  getMobs() {
    this.configurationService.getMobs().subscribe({
      next: (res) => {
        console.log(res);
        this.bossesCheckboxList = res.bossesArray;
        this.elitesCheckboxList = res.elitesArray;
        this.addCheckbox(this.bossesCheckboxList, this.excludedBosses);
        this.addCheckbox(this.elitesCheckboxList, this.excludedElites);
      },
    });
  }

  onRegister(): void {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    const { confirmPassword, excludedBosses, excludedElites, ...userInfo } =
      this.form.value;

    this.userService
      .createUser(userInfo, [
        ...this.selectedBossesCheckbox,
        ...this.selectedElitesCheckbox,
      ])
      .subscribe({
        next: (res) => {
          console.log(res);
          this.messageService.create('success', 'Пользователь успешно создан');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          if (
            err.error.message ===
            'A user with such an email or nickname already exists!'
          ) {
            return this.messageService.create(
              'error',
              'Пользователь с данным никнеймом или почтой уже существует',
            );
          }
          if (err.error.message === 'Wrong SessionId!') {
            return this.messageService.create(
              'error',
              'Невалидный Session ID!',
            );
          }
          return this.messageService.create(
            'error',
            'Ошибка, обратитесь к создателям таймера',
          );
        },
      });
  }

  onChangeCheckbox(value: string[], type: string): void {
    if (type === 'Босс') {
      this.selectedBossesCheckbox = value;
    }

    if (type === 'Элитка') {
      this.selectedElitesCheckbox = value;
    }
  }
}
