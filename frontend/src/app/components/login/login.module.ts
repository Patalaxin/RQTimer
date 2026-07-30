import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { NoAuthGuard } from 'src/app/guard/no-auth.guard';
import { LoginComponent } from './login.component';

const routes: Routes = [
  { path: '', component: LoginComponent, canActivate: [NoAuthGuard] },
];

@NgModule({
  declarations: [LoginComponent],
  imports: [SharedModule, TranslateModule, RouterModule.forChild(routes)],
})
export class LoginModule {}
