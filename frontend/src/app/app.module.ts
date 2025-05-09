import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './modules/core/core.module';
import { SharedModule } from './modules/shared/shared.module';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from './translate-loader.factory';

import { AppComponent } from './app.component';
import { HeaderComponent } from './common/header/header.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { HistoryComponent } from './components/history/history.component';
import { LogComponent } from './components/history/log/log.component';
import { LoginComponent } from './components/login/login.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { AdminComponent } from './components/profile/admin/admin.component';
import { InfoComponent } from './components/profile/info/info.component';
import { ProfileComponent } from './components/profile/profile.component';
import { UserComponent } from './components/profile/user/user.component';
import { RegisterComponent } from './components/register/register.component';
import { MobModalComponent } from './components/timer/mob-modal/mob-modal.component';
import { TimerComponent } from './components/timer/timer.component';

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

import { TUI_SANITIZER } from '@taiga-ui/core';
import { NgDompurifySanitizer } from '@tinkoff/ng-dompurify';
import { TimerSettingsComponent } from './components/timer/timer-settings/timer-settings.component';

import { CapitalizeDirective } from './directives/capitalize.directive';
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
  declarations: [
    AppComponent,
    LoginComponent,
    HeaderComponent,
    RegisterComponent,
    ChangePasswordComponent,
    TimerComponent,
    ProfileComponent,
    InfoComponent,
    UserComponent,
    HistoryComponent,
    LogComponent,
    AdminComponent,
    MobModalComponent,
    NotFoundComponent,
    TimerSettingsComponent,
    CapitalizeDirective,
    LanguageSwitcherComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    NgOptimizedImage,
    HttpClientModule,
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
    { provide: TUI_SANITIZER, useClass: NgDompurifySanitizer },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
