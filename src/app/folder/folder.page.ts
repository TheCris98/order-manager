import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LocalStorageService } from '../services/core-services/local-storage.service';
import { UserData } from '../models/navigation';
import { AuthFirebaseService } from '../services/firebase-services/auth-firebase.service';
import { SuscriptionManagerService } from '../services/core-services/suscription-manager.service';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  public folder!: string;
  user: UserData = this.authFirebaseService.loadUserFromLocalStorage();
  public appPages = [
    { title: 'Perfil', url: 'profile', icon: 'person-circle' },
    { title: 'Órdenes', url: 'orders', icon: 'list' },
    /* TODO: CREAR LOS OTROS COMPONENTES PARA FINALIZAR CON LA CREACIÓN DE RUTAS */
    { title: 'Tienda', url: 'shop', icon: 'pricetags' },
    /* { title: 'Cobro', url: '/folder/cashier', icon: 'cash' },
    { title: 'Ventas', url: '/folder/sales', icon: 'time' },
    { title: 'Reportes', url: '/folder/reports', icon: 'bar-chart' },
    { title: 'Gestión', url: '/folder/manage', icon: 'add-circle' },
    { title: 'Cocina', url: 'kitchen', icon: 'flame' },*/
    { title: 'Log Out', url: 'login', icon: 'log-out', special: true },
  ];
  constructor(
    private router: Router,
    private authFirebaseService: AuthFirebaseService,
    private localStorage: LocalStorageService,
    private subscriptionService: SuscriptionManagerService
  ) {
  }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.setTitle();
    });
  }

  private setTitle() {
    const segments = this.router.url.split('/').filter(segment => segment);
    const lastSegment = segments.pop(); // Obtiene el último segmento de la URL

    if (lastSegment) {
      const page = this.appPages.find(p => p.url === lastSegment);
      this.folder = page ? page.title : 'Folder';
    }
  }

  logOut() {
    // Aquí tu lógica para cerrar sesión
    console.log('Cerrando sesión...');
    this.localStorage.removeLocalStorageItem('user');
    this.localStorage.removeLocalStorageItem('cart');
    // Por ejemplo, redirigir al usuario a la página de inicio de sesión:
    this.subscriptionService.finishSubscriptions();
    this.router.navigate(['/login']);
  }

}
