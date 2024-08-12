import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { StorageService } from '../services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private storageService: StorageService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.checkLogin();
  }

  private checkLogin(): boolean {
    const isLoggedIn = this.storageService.isLoggedIn();

    if (!isLoggedIn) {
      this.router.navigate(['/login']);
    }

    return isLoggedIn;
  }
}
