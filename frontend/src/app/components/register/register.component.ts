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

  bossesCheckboxList = [
    { value: 'Аркон', type: 'Боссы' },
    { value: 'Архон', type: 'Боссы' },
    { value: 'Баксбакуалануксивайе', type: 'Боссы' },
    { value: 'Воко', type: 'Боссы' },
    { value: 'Гигантская Тортолла', type: 'Боссы' },
    { value: 'Денгур Кровавый топор', type: 'Боссы' },
    { value: 'Деструктор', type: 'Боссы' },
    { value: 'Древний Энт', type: 'Боссы' },
    { value: 'Зверомор', type: 'Боссы' },
    { value: 'Королева Крыс', type: 'Боссы' },
    { value: 'Пружинка', type: 'Боссы' },
    { value: 'Тёмный Шаман', type: 'Боссы' },
    { value: 'Хьюго', type: 'Боссы' },
    { value: 'Эдвард', type: 'Боссы' },
  ];

  elitesCheckboxList = [
    { value: 'Альфа Самец', type: 'Элитка' },
    { value: 'Богатый Упырь', type: 'Элитка' },
    { value: 'Жужелица Тёмная', type: 'Элитка' },
    { value: 'Золотой Таракан', type: 'Элитка' },
    { value: 'Кабан Вожак', type: 'Элитка' },
    { value: 'Королева Термитов', type: 'Элитка' },
    { value: 'Королевская Терния', type: 'Элитка' },
    { value: 'Королевский Паук', type: 'Элитка' },
    { value: 'Лякуша', type: 'Элитка' },
    { value: 'Мега Ирекс', type: 'Элитка' },
    { value: 'Пещерный Волк', type: 'Элитка' },
    { value: 'Пламярык', type: 'Элитка' },
    { value: 'Превосходный пожиратель моземия', type: 'Элитка' },
    { value: 'Превосходный пожиратель элениума', type: 'Элитка' },
    { value: 'Самка Жужа', type: 'Элитка' },
    { value: 'Слепоглаз', type: 'Элитка' },
    { value: 'Советник Остина', type: 'Элитка' },
    { value: 'Тринадцатый Крыс', type: 'Элитка' },
    { value: 'Тёмный Оракул', type: 'Элитка' },
    { value: 'Фараон', type: 'Элитка' },
    { value: 'Хозяин', type: 'Элитка' },
    { value: 'Чёрная Вдова', type: 'Элитка' },
  ];

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
    if (type === 'Боссы') {
      this.selectedBossesCheckbox = value;
    }

    if (type === 'Элитки') {
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

    this.addCheckbox(this.bossesCheckboxList, this.excludedBosses);
    this.addCheckbox(this.elitesCheckboxList, this.excludedElites);
  }
}
