import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { AuthGuard } from 'src/app/guard/auth.guard';
import { NotFoundComponent } from './not-found.component';

const routes: Routes = [
  { path: '', component: NotFoundComponent, canActivate: [AuthGuard] },
];

@NgModule({
  declarations: [NotFoundComponent],
  imports: [SharedModule, TranslateModule, RouterModule.forChild(routes)],
})
export class NotFoundModule {}
