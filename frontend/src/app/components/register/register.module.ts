import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { NoAuthGuard } from 'src/app/guard/no-auth.guard';
import { CapitalizeDirective } from 'src/app/directives/capitalize.directive';
import { RegisterComponent } from './register.component';

const routes: Routes = [
  { path: '', component: RegisterComponent, canActivate: [NoAuthGuard] },
];

@NgModule({
  declarations: [RegisterComponent, CapitalizeDirective],
  imports: [SharedModule, TranslateModule, RouterModule.forChild(routes)],
})
export class RegisterModule {}
