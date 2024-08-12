import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
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
  private userService = inject(UserService);
  private configurationService = inject(ConfigurationService);
  private messageService = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  @Input() excludedMobs: any;
  @Input() role: string = '';

  isLoading: boolean = true;

  selectedBossesCheckbox: string[] = [];
  selectedElitesCheckbox: string[] = [];

  bossesCheckboxList: any;
  elitesCheckboxList: any;

  bossList: string[] = [];
  eliteList: string[] = [];

  excludedForm: FormGroup = new FormGroup({
    excludedBosses: new FormArray([]),
    excludedElites: new FormArray([]),
  });
  excludedSubmitted: boolean = false;

  changePasswordForm: FormGroup = new FormGroup(
    {
      oldPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
      ]),
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
      ]),
      confirmNewPassword: new FormControl('', [Validators.required]),
    },
    {
      validators: [Validation.match('newPassword', 'confirmNewPassword')],
    }
  );
  changePasswordSubmitted: boolean = false;

  passwordVisible: boolean = false;

  ngOnInit(): void {
    this.getMobs();
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
        res.bossesArray.forEach((boss: any) => {
          this.bossList.push(boss.mobName);
        });
        res.elitesArray.forEach((elite: any) => {
          this.eliteList.push(elite.mobName);
        });
        this.bossesCheckboxList = res.bossesArray;
        this.elitesCheckboxList = res.elitesArray;
        this.addCheckbox(this.bossesCheckboxList, this.excludedBosses);
        this.addCheckbox(this.elitesCheckboxList, this.excludedElites);
        this.isLoading = false;

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
          this.messageService.create(
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
          this.messageService.create('success', 'Пароль успешно изменён');

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
}
