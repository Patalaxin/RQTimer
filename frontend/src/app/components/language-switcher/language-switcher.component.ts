import { Component, inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { en_US, ru_RU, vi_VN, pl_PL, NzI18nService } from 'ng-zorro-antd/i18n';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styles: [
    `
      select {
        padding: 5px;
        border-radius: 4px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        margin-right: 10px;
      }
    `,
  ],
})
export class LanguageSwitcherComponent implements OnInit {
  private readonly messageService = inject(NzMessageService);
  private readonly translateService = inject(TranslateService);
  private readonly i18nService = inject(NzI18nService);

  currentLang: string;
  langList = [
    { label: 'RU', value: 'ru', name: 'Русский' },
    { label: 'EN', value: 'en', name: 'English' },
    // { label: 'Tiếng Việt', value: 'vi' },
    // { label: 'Polski', value: 'pl' },
  ];

  constructor() {
    this.currentLang = localStorage.getItem('language') || 'ru';
  }

  ngOnInit() {
    // Устанавливаем начальный язык
    this.translateService.use(this.currentLang);
  }

  switchLanguage(event: any): void {
    const lang = event;
    const langLabel = this.langList.find((lang) => lang.value === event)?.name;
    this.translateService.use(lang);
    this.currentLang = lang;
    localStorage.setItem('language', lang);

    switch (lang) {
      case 'ru':
        this.i18nService.setLocale(ru_RU);
        break;
      case 'en':
        this.i18nService.setLocale(en_US);
        break;
      // case 'vi':
      //   this.i18nService.setLocale(vi_VN);
      //   break;
      // case 'pl':
      //   this.i18nService.setLocale(pl_PL);
      //   break;
      default:
        this.i18nService.setLocale(ru_RU);
    }

    this.messageService.create(
      'success',
      this.translateService.instant(
        'LANGUAGE_SWITCHER.MESSAGE.CHANGE_LANGUAGE',
        { language: langLabel },
      ),
    );
  }
}
