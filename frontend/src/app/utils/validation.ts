import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export default class Validation {
  static match(controlName: string, checkControlName: string): ValidatorFn {
    return (controls: AbstractControl) => {
      const control = controls.get(controlName);
      const checkControl = controls.get(checkControlName);

      if (checkControl?.errors && !checkControl.errors['matching']) {
        return null;
      }

      if (control?.value !== checkControl?.value) {
        checkControl?.setErrors({ matching: true });
      } else {
        checkControl?.setErrors(null);
      }

      return null;
    };
  }

  static passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';

    const hasNumber = /\d/.test(value);
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);

    const errors: any = {};

    if (!hasNumber) {
      errors.missingNumber = 'Пароль должен содержать хотя бы одну цифру.';
    }
    if (!hasUpperCase) {
      errors.missingUpperCase =
        'Пароль должен содержать хотя бы одну заглавную букву.';
    }
    if (!hasLowerCase) {
      errors.missingLowerCase =
        'Пароль должен содержать хотя бы одну строчную букву.';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  static nicknameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    const errors: any = {};

    if (!/^[A-ZА-Я]/.test(value)) {
      errors.mustStartWithUppercase =
        'Никнейм должен начинаться с заглавной буквы.';
    }

    const uppercaseLettersCount = (value.match(/[A-ZА-Я]/g) || []).length;
    if (uppercaseLettersCount > 2) {
      errors.tooManyUppercase =
        'Никнейм может содержать не более 2 заглавных букв.';
    }

    const hyphenCount = (value.match(/-/g) || []).length;
    if (hyphenCount > 1) {
      errors.tooManyHyphens = 'Никнейм может содержать не более одного дефиса.';
    }

    const hasLatin = /[A-Za-z]/.test(value);
    const hasCyrillic = /[А-Яа-я]/.test(value);
    if (hasLatin && hasCyrillic) {
      errors.mixedCyrillicAndLatin =
        'Никнейм не может содержать смешение кириллицы и латиницы.';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }
}
