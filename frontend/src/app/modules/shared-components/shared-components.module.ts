import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { InfoComponent } from 'src/app/components/profile/info/info.component';
import { LogComponent } from 'src/app/components/history/log/log.component';

/**
 * InfoComponent и LogComponent используются больше чем в одном ленивом
 * фиче-модуле (Profile/History и Timer/History соответственно) — компонент
 * может быть declared только в одном NgModule, поэтому оба объявлены здесь
 * и экспортированы для остальных.
 */
@NgModule({
  declarations: [InfoComponent, LogComponent],
  imports: [SharedModule, TranslateModule],
  exports: [InfoComponent, LogComponent],
})
export class SharedComponentsModule {}
