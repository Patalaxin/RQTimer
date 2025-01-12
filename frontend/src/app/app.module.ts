import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './modules/core/core.module';
import { SharedModule } from './modules/shared/shared.module';

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
import { NZ_I18N, ru_RU } from 'ng-zorro-antd/i18n';

import { TUI_SANITIZER, TuiHintModule } from '@taiga-ui/core';
import { NgDompurifySanitizer } from '@tinkoff/ng-dompurify';
import { TimerSettingsComponent } from './components/timer/timer-settings/timer-settings.component';

import { CapitalizeDirective } from './directives/capitalize.directive';
import { ButtonComponent } from '@shared/components/button/button.component';

registerLocaleData(ru);

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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    NgOptimizedImage,
    ButtonComponent,
    TuiHintModule,
  ],
  providers: [
    { provide: NZ_I18N, useValue: ru_RU },
    { provide: TUI_SANITIZER, useClass: NgDompurifySanitizer },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
