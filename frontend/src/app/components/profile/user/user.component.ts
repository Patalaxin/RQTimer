import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserService } from 'src/app/services/user.service';
import Validation from 'src/app/utils/validtion';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit, AfterViewInit {
  @Input() excluded: any;
  @Input() role: string = '';

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

  excludedForm: FormGroup = new FormGroup({
    excludedBosses: new FormArray([]),
    excludedElites: new FormArray([]),
  });
  excludedSubmitted: boolean = false;

  changePasswordForm: FormGroup = new FormGroup({
    oldPassword: new FormControl(''),
    newPassword: new FormControl(''),
    confirmNewPassword: new FormControl(''),
  });
  changePasswordSubmitted: boolean = false;

  passwordVisible: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private message: NzMessageService,
    private cdref: ChangeDetectorRef
  ) {}

  get excludedBosses() {
    return this.excludedForm.controls['excludedBosses'] as FormArray;
  }

  get excludedElites() {
    return this.excludedForm.controls['excludedElites'] as FormArray;
  }

  onUpdateExcluded(): void {
    this.excludedSubmitted = true;

    if (this.excludedForm.invalid) {
      return;
    }

    this.userService
      .updateExcluded(this.selectedBossesCheckbox, this.selectedElitesCheckbox)
      .subscribe({
        next: (res) => {
          console.log(res);
          this.message.create(
            'success',
            'Настройки отображения успешно обновлены'
          );
        },
      });
  }

  onChangePassword() {
    this.changePasswordSubmitted = true;

    if (this.changePasswordForm.invalid) {
      return;
    }

    this.userService
      .changePassword(
        this.changePasswordForm.value.oldPassword,
        this.changePasswordForm.value.newPassword
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          this.message.create('success', 'Пароль успешно изменён');

          this.changePasswordForm.reset();
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
    this.excludedForm = this.formBuilder.group({
      excludedBosses: this.formBuilder.array([]),
      excludedElites: this.formBuilder.array([]),
    });

    this.changePasswordForm = this.formBuilder.group(
      {
        oldPassword: ['', [Validators.required, Validators.minLength(3)]],
        newPassword: ['', [Validators.required, Validators.minLength(3)]],
        confirmNewPassword: ['', [Validators.required]],
      },
      {
        validators: [Validation.match('newPassword', 'confirmNewPassword')],
      }
    );

    this.addCheckbox(this.bossesCheckboxList, this.excludedBosses);
    this.addCheckbox(this.elitesCheckboxList, this.excludedElites);
  }

  ngAfterViewInit(): void {
    let bossesCheckbox = document.querySelectorAll('.boss-input');
    let elitesCheckbox = document.querySelectorAll('.elite-input');
    Array.from(bossesCheckbox).map((item) => {
      if (this.excluded.excludedBosses) {
        this.excluded.excludedBosses.map((boss: any) => {
          if (boss === item.textContent?.trim()) {
            (item as HTMLInputElement).click();
          }
        });
      }
    });
    Array.from(elitesCheckbox).map((item) => {
      if (this.excluded.excludedElites) {
        this.excluded.excludedElites.map((elite: any) => {
          if (elite === item.textContent?.trim()) {
            (item as HTMLInputElement).click();
          }
        });
      }
    });
    this.cdref.detectChanges();
  }
}
