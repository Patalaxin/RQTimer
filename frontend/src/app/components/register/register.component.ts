import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgxOtpInputComponentOptions } from 'ngx-otp-input';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { OtpService } from 'src/app/services/otp.service';
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
  private readonly otpService = inject(OtpService);
  private readonly translateService = inject(TranslateService);
  private readonly configurationService = inject(ConfigurationService);
  private readonly messageService = inject(NzMessageService);

  isModalVisible: boolean = false;
  isModalLoading: boolean = false;

  currentStep: number = 0;

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

  otpOptions: NgxOtpInputComponentOptions = {
    otpLength: 5,
    autoFocus: true,
    showBlinkingCursor: false,
  };

  isVerifyDisabled: boolean = true;

  otpTimer: number = 60;
  otpComplete: string = '';
  otpInterval: any;

  form: FormGroup = new FormGroup(
    {
      nickname: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(16),
        Validation.nicknameValidator,
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
      excludedBosses: new FormArray([]),
      excludedElites: new FormArray([]),
    },
    {
      validators: [Validation.match('password', 'confirmPassword')],
    },
  );
  submitted: boolean = false;
  passwordVisible: boolean = false;
  registerLoading: boolean = false;

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
    this.registerLoading = true;
    this.onSendOTP();
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
    const lang = localStorage.getItem('language') || 'ru';
    this.configurationService.getMobs(lang).subscribe({
      next: (res) => {
        this.bossesCheckboxList = res.bossesArray;
        this.elitesCheckboxList = res.elitesArray;
        this.addCheckbox(this.bossesCheckboxList, this.excludedBosses);
        this.addCheckbox(this.elitesCheckboxList, this.excludedElites);
      },
    });
  }

  onSendOTP(): void {
    // this.showModal();
    this.otpService.sendOTP(this.form.value['email']).subscribe({
      next: () => {
        this.showModal();
      },
      error: () => {
        this.registerLoading = false;
      },
    });
  }

  showModal(): void {
    event?.stopPropagation();
    this.isModalVisible = true;
    clearInterval(this.otpInterval);
    this.otpTimer = 60;
    this.otpInterval = setInterval(() => {
      if (this.otpTimer > 0) {
        this.otpTimer--;
      }
    }, 1000);
  }

  cancelModal(): void {
    clearInterval(this.otpInterval);
    this.registerLoading = false;
    this.isModalVisible = false;
  }

  onChangeOTP(event: any): void {
    let otpCount: number = 0;
    event.map((item: string) => {
      if (item) {
        otpCount++;
      }
    });
    if (otpCount === 5) {
      this.isVerifyDisabled = false;
    } else {
      this.isVerifyDisabled = true;
    }
  }

  onCompleteOTP(event: any): void {
    this.otpComplete = event;
  }

  onVerifyOTP(): void {
    this.isModalLoading = true;
    this.otpService
      .verifyOTP(this.form.value['email'], this.otpComplete)
      .subscribe({
        next: () => {
          this.onRegister();
        },
        error: () => {
          this.isModalLoading = false;
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
        next: () => {
          this.registerLoading = false;
          this.isModalLoading = false;
          this.isModalVisible = false;
          this.messageService.create(
            'success',
            this.translateService.instant(
              'REGISTER.MESSAGE.USER_CREATED_SUCCESSFULLY',
            ),
          );
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.registerLoading = false;
          this.isModalLoading = false;
          if (
            err.error.message ===
            'A user with such an email or nickname already exists!'
          ) {
            return this.messageService.create(
              'error',
              this.translateService.instant(
                'REGISTER.MESSAGE.USER_ALREADY_EXISTS',
              ),
            );
          }
          return this.messageService.create(
            'error',
            this.translateService.instant('REGISTER.MESSAGE.UNKNOWN_ERROR'),
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
