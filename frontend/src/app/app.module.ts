import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';

import { httpInterceptorProviders } from './auth.interceptor';
import { HeaderComponent } from './common/header/header.component';
import { RegisterComponent } from './components/register/register.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { TimerComponent } from './components/timer/timer.component';
import { ProfileComponent } from './components/profile/profile.component';
import { InfoComponent } from './components/profile/info/info.component';
import { UserComponent } from './components/profile/user/user.component';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { ru_RU } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import ru from '@angular/common/locales/ru';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { HistoryComponent } from './components/history/history.component';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { LogComponent } from './components/history/log/log.component';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzStepsModule,
    NzIconModule,
    NzMessageModule,
    NzSkeletonModule,
    NzTabsModule,
    NzListModule,
    NzStatisticModule,
    NzProgressModule,
    NzSelectModule,
    NzBadgeModule,
    NzModalModule,
    NzPageHeaderModule,
    NzToolTipModule,
    NzTimePickerModule,
    NzDatePickerModule,
    NzPopoverModule,
    NzDropDownModule,
    NzRadioModule,
    NzTagModule,
    NzTimelineModule,
    NzSpaceModule,
    NzInputNumberModule,
  ],
  providers: [httpInterceptorProviders, { provide: NZ_I18N, useValue: ru_RU }],
  bootstrap: [AppComponent],
})
export class AppModule {}
