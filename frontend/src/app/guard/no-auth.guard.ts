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
export class NoAuthGuard implements CanActivate {
  constructor(private storageService: StorageService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.checkIfNotLoggedIn();
  }

  private checkIfNotLoggedIn(): boolean {
    const isLoggedIn = this.storageService.isLoggedIn();

    if (isLoggedIn) {
      this.router.navigate(['/timer']);
    }

    return !isLoggedIn;
  }
}
