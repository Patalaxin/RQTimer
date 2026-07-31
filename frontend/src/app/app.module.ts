import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './modules/core/core.module';
import { SharedModule } from './modules/shared/shared.module';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from './translate-loader.factory';

import { AppComponent } from './app.component';
import { HeaderComponent } from './common/header/header.component';

import { NgOptimizedImage, registerLocaleData } from '@angular/common';
import ru from '@angular/common/locales/ru';
import {
  en_US,
  NZ_I18N,
  NzI18nInterface,
  pl_PL,
  ru_RU,
  vi_VN,
} from 'ng-zorro-antd/i18n';

import { provideEventPlugins } from '@taiga-ui/event-plugins';
import { provideTaiga } from '@taiga-ui/core';
import { provideUiTour } from 'ngx-ui-tour-tui-dropdown';

import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';

registerLocaleData(ru);

export function getZorroLocale(): NzI18nInterface {
  const lang = localStorage.getItem('language');
  switch (lang) {
    case 'en':
      return en_US;
    // case 'vi':
    //   return vi_VN;
    // case 'pl':
    //   return pl_PL;
    default:
      return ru_RU;
  }
}

@NgModule({
  declarations: [AppComponent, HeaderComponent, LanguageSwitcherComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    NgOptimizedImage,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      defaultLanguage: 'ru',
    }),
  ],
  providers: [
    { provide: NZ_I18N, useFactory: getZorroLocale },
    provideEventPlugins(),
    provideTaiga(),
    provideUiTour(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
