import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { SharedComponentsModule } from 'src/app/modules/shared-components/shared-components.module';
import { AuthGuard } from 'src/app/guard/auth.guard';
import { ProfileComponent } from './profile.component';
import { UserComponent } from './user/user.component';
import { AdminComponent } from './admin/admin.component';

const routes: Routes = [
  { path: '', component: ProfileComponent, canActivate: [AuthGuard] },
];

@NgModule({
  declarations: [ProfileComponent, UserComponent, AdminComponent],
  imports: [
    SharedModule,
    SharedComponentsModule,
    TranslateModule,
    RouterModule.forChild(routes),
  ],
})
export class ProfileModule {}
