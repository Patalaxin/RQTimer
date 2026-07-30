import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { SharedComponentsModule } from 'src/app/modules/shared-components/shared-components.module';
import { AuthGuard } from 'src/app/guard/auth.guard';
import { TimerComponent } from './timer.component';
import { MobModalComponent } from './mob-modal/mob-modal.component';
import { TimerSettingsComponent } from './timer-settings/timer-settings.component';

const routes: Routes = [
  { path: '', component: TimerComponent, canActivate: [AuthGuard] },
];

@NgModule({
  declarations: [TimerComponent, MobModalComponent, TimerSettingsComponent],
  imports: [
    SharedModule,
    SharedComponentsModule,
    TranslateModule,
    RouterModule.forChild(routes),
  ],
})
export class TimerModule {}
