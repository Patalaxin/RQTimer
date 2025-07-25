import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { UserService } from 'src/app/services/user.service';
import Validation from 'src/app/utils/validation';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly configurationService = inject(ConfigurationService);
  private readonly translateService = inject(TranslateService);
  private readonly messageService = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() excludedMobs: any;
  @Input() role: string = '';

  isLoading: boolean = true;

  duplicatedMobList: any = [
    '673a9b38697139657bf024ad',
    '673a9b3f697139657bf024b5',
    '673a9b46697139657bf024b9',
    '673a9b4e697139657bf024bd',
    '67314c701e738aba75ba3484',
    '67314c5f1e738aba75ba3480',
    '67314c511e738aba75ba347c',
    '67314d111e738aba75ba3488',
    '67314d191e738aba75ba348c',
    '67314d431e738aba75ba3490',
    '67314e2d1e738aba75ba349e',
    '67314e341e738aba75ba34a2',
    '673151961e738aba75ba34ce',
    '6731519c1e738aba75ba34d2',
    '673152a61e738aba75ba34e8',
    '673152aa1e738aba75ba34ec',
  ];

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
      oldPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(64),
        Validation.passwordValidator,
        // Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,64}$/),
      ]),
      confirmNewPassword: new FormControl('', [Validators.required]),
    },
    {
      validators: [Validation.match('newPassword', 'confirmNewPassword')],
    },
  );
  changePasswordSubmitted: boolean = false;

  passwordVisible: boolean = false;
  passwordChangeLoading: boolean = false;

  ngOnInit(): void {
    this.getMobs();
  }

  private addCheckbox(checkboxList: any[], control: FormArray): void {
    checkboxList.forEach(() => {
      control.push(new FormControl());
    });
  }

  get excludedBosses() {
    return this.excludedForm.controls['excludedBosses'] as FormArray;
  }

  get excludedElites() {
    return this.excludedForm.controls['excludedElites'] as FormArray;
  }

  getMobs() {
    const lang = localStorage.getItem('language') || 'ru';
    this.configurationService.getMobs(lang).subscribe({
      next: (res) => {
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

        this.bossesCheckboxList.forEach((boss: any, i: number) => {
          if (this.excludedMobs && this.excludedMobs.includes(boss._id)) {
            this.excludedBosses.at(i).setValue(true);
          }
        });
        this.elitesCheckboxList.forEach((elite: any, i: number) => {
          if (this.excludedMobs && this.excludedMobs.includes(elite._id)) {
            this.excludedElites.at(i).setValue(true);
          }
        });

        this.cdr.detectChanges();
      },
    });
  }

  onUpdateExcluded(): void {
    this.excludedSubmitted = true;

    if (this.excludedForm.invalid) {
      return;
    }

    const selectedBosses = this.bossesCheckboxList
      .filter((_: any, i: number) => this.excludedBosses.at(i).value)
      .map((boss: any) => boss._id);

    const selectedElites = this.elitesCheckboxList
      .filter((_: any, i: number) => this.excludedElites.at(i).value)
      .map((elite: any) => elite._id);

    const newExcludedMobs = [...selectedBosses, ...selectedElites];

    this.userService.updateExcluded(newExcludedMobs).subscribe({
      next: () => {
        this.excludedMobs = newExcludedMobs;
        this.messageService.create(
          'success',
          this.translateService.instant(
            'USER.MESSAGE.DISPLAY_SETTINGS_UPDATED_SUCCESS',
          ),
        );
      },
    });
  }

  onChangePassword() {
    this.passwordChangeLoading = true;
    this.changePasswordSubmitted = true;

    if (this.changePasswordForm.invalid) {
      return;
    }

    this.userService
      .changePassword(
        this.changePasswordForm.value.oldPassword,
        this.changePasswordForm.value.newPassword,
      )
      .subscribe({
        next: () => {
          this.passwordChangeLoading = false;
          this.messageService.create(
            'success',
            this.translateService.instant(
              'USER.MESSAGE.PASSWORD_CHANGED_SUCCESSFULLY',
            ),
          );

          this.changePasswordForm.reset();
        },
        error: (err) => {
          this.passwordChangeLoading = false;
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
