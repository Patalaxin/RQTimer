import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { UserService } from 'src/app/services/user.service';
import Validation from 'src/app/utils/validtion';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  currentStep: number = 0;

  selectedBossesCheckbox: string[] = [];
  selectedElitesCheckbox: string[] = [];

  bossesCheckboxList: any;
  elitesCheckboxList: any;

  form: FormGroup = new FormGroup({
    nickname: new FormControl(''),
    email: new FormControl(''),
    password: new FormControl(''),
    confirmPassword: new FormControl(''),
    sessionId: new FormControl(''),
    excludedBosses: new FormArray([]),
    excludedElites: new FormArray([]),
  });
  submitted: boolean = false;
  passwordVisible: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private configurationService: ConfigurationService,
    private message: NzMessageService,
    private router: Router
  ) {}

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

  get f(): { [key: string]: AbstractControl } {
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

    this.userService
      .createUser(
        this.form.value.nickname,
        this.form.value.email,
        this.form.value.password,
        this.form.value.sessionId,
        [...this.selectedBossesCheckbox, ...this.selectedElitesCheckbox]
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          this.message.create('success', 'Пользователь успешно создан');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          if (
            err.message ===
            'A user with such an email or nickname already exists!'
          ) {
            return this.message.create(
              'error',
              'Пользователь с данным никнеймом или почтой уже существует'
            );
          }
          return this.message.create(
            'error',
            'Ошибка, обратитесь к создателям таймера'
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

  private addCheckbox(checkboxList: any[], control: FormArray): void {
    checkboxList.forEach(() => {
      control.push(new FormControl());
    });
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group(
      {
        nickname: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(3)]],
        confirmPassword: ['', [Validators.required]],
        sessionId: ['', [Validators.required]],
        excludedBosses: this.formBuilder.array([]),
        excludedElites: this.formBuilder.array([]),
      },
      {
        validators: [Validation.match('password', 'confirmPassword')],
      }
    );

    this.getMobs();
  }
}
