import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { UserService } from 'src/app/services/user.service';
import Validation from 'src/app/utils/validtion';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {
  @Input() excludedMobs: any;
  @Input() role: string = '';

  isLoading: boolean = true;

  selectedBossesCheckbox: string[] = [];
  selectedElitesCheckbox: string[] = [];

  bossesCheckboxList: any;
  elitesCheckboxList: any;

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
    private configurationService: ConfigurationService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  get excludedBosses() {
    return this.excludedForm.controls['excludedBosses'] as FormArray;
  }

  get excludedElites() {
    return this.excludedForm.controls['excludedElites'] as FormArray;
  }

  getMobs() {
    this.configurationService.getMobs().subscribe({
      next: (res) => {
        console.log(res);
        this.bossesCheckboxList = res.bossesArray;
        this.elitesCheckboxList = res.elitesArray;
        this.addCheckbox(this.bossesCheckboxList, this.excludedBosses);
        this.addCheckbox(this.elitesCheckboxList, this.excludedElites);
        this.isLoading = false;

        // Ожидание завершения добавления чекбоксов и обновление DOM
        this.cdr.detectChanges();
        this.checkExcludedMobs();
      },
    });
  }

  onUpdateExcluded(): void {
    this.excludedSubmitted = true;

    if (this.excludedForm.invalid) {
      return;
    }

    this.userService
      .updateExcluded([
        ...this.selectedBossesCheckbox,
        ...this.selectedElitesCheckbox,
      ])
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

  private checkExcludedMobs(): void {
    let bossesCheckbox = document.querySelectorAll('.boss-input');
    let elitesCheckbox = document.querySelectorAll('.elite-input');
    Array.from(bossesCheckbox).forEach((item) => {
      if (this.excludedMobs) {
        this.excludedMobs.forEach((boss: any) => {
          if (boss === item.textContent?.trim()) {
            console.log('boss', boss, 'checkbox', item.textContent?.trim());
            (item as HTMLInputElement).click();
          }
        });
      }
    });
    Array.from(elitesCheckbox).forEach((item) => {
      if (this.excludedMobs) {
        this.excludedMobs.forEach((elite: any) => {
          if (elite === item.textContent?.trim()) {
            (item as HTMLInputElement).click();
          }
        });
      }
    });
    this.cdr.detectChanges();
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

    this.getMobs();
  }
}
