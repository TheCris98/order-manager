import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router,
    private localStorage: LocalStorageService) {
  }

  canActivate(
    route: ActivatedRouteSnapshot) {
    const auth = this.localStorage.getLocalStorageItem('user');
    if (auth) {
      return true;
    }
    this.router.navigate(['/login'])
    return false;
  }

}
