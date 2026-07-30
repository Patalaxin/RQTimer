import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { NoAuthGuard } from 'src/app/guard/no-auth.guard';
import { ChangePasswordComponent } from './change-password.component';

const routes: Routes = [
  { path: '', component: ChangePasswordComponent, canActivate: [NoAuthGuard] },
];

@NgModule({
  declarations: [ChangePasswordComponent],
  imports: [SharedModule, TranslateModule, RouterModule.forChild(routes)],
})
export class ChangePasswordModule {}
