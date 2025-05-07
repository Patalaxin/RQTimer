import { Component, inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';

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
  private readonly translate = inject(TranslateService);
  private readonly messageService = inject(NzMessageService);

  currentLang: string;
  langList = [
    { label: 'Русский', value: 'ru' },
    { label: 'English', value: 'en' },
  ];

  constructor() {
    this.currentLang = localStorage.getItem('language') || 'ru';
  }

  ngOnInit() {
    // Устанавливаем начальный язык
    this.translate.use(this.currentLang);
  }

  switchLanguage(event: any): void {
    const lang = event;
    this.translate.use(lang);
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    this.messageService.create('success', `Язык успешно сменен на ${lang}`);
  }
}
