import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { SharedComponentsModule } from 'src/app/modules/shared-components/shared-components.module';
import { AuthGuard } from 'src/app/guard/auth.guard';
import { HistoryComponent } from './history.component';

const routes: Routes = [
  { path: '', component: HistoryComponent, canActivate: [AuthGuard] },
];

@NgModule({
  declarations: [HistoryComponent],
  imports: [
    SharedModule,
    SharedComponentsModule,
    TranslateModule,
    RouterModule.forChild(routes),
  ],
})
export class HistoryModule {}
