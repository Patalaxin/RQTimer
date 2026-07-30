import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./components/login/login.module').then((m) => m.LoginModule),
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./components/register/register.module').then(
        (m) => m.RegisterModule,
      ),
  },
  {
    path: 'change-password',
    loadChildren: () =>
      import('./components/change-password/change-password.module').then(
        (m) => m.ChangePasswordModule,
      ),
  },
  {
    path: 'timer',
    loadChildren: () =>
      import('./components/timer/timer.module').then((m) => m.TimerModule),
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./components/profile/profile.module').then(
        (m) => m.ProfileModule,
      ),
  },
  {
    path: 'history',
    loadChildren: () =>
      import('./components/history/history.module').then(
        (m) => m.HistoryModule,
      ),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '**',
    loadChildren: () =>
      import('./components/not-found/not-found.module').then(
        (m) => m.NotFoundModule,
      ),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
