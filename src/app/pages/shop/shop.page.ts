import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonSearchbar } from '@ionic/angular';
import { Categorie } from 'src/app/models/navigation';
import { AlertsService } from 'src/app/services/alerts.service';
import { CategoriesFirebaseService } from 'src/app/services/categories-firebase.service';
import { ProductsFirebaseService } from 'src/app/services/products-firebase.service';
import { SuscriptionManagerService } from 'src/app/services/suscription-manager.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.page.html',
  styleUrls: ['./shop.page.scss'],
})
export class ShopPage implements OnInit, OnDestroy {
  categories: Categorie[] = [];
  @ViewChild('searchBar') searchBar!: IonSearchbar;


  constructor(
    private router: Router,
    private categoriesService: CategoriesFirebaseService,
    private alertService: AlertsService,
    private suscriptionService: SuscriptionManagerService,
    private productService: ProductsFirebaseService,
  ) { }

  ngOnInit() {
    this.getCategories()
  }

  ngOnDestroy() {
    this.suscriptionService.unsubscribe(this);
  }

  /* TODO: Manejar las suscripciones eficientemente para no tener comportamientos raros
  Disclaimer: Aparentemente será mejor usar BehaviorSubjects en otras partes de la aplicación
  */
  getCategories() {
    const subscription = this.categoriesService.getCategories().subscribe({
      next: (data) => {
        this.categories = data.data;
      },
      error: (error) => {
        this.alertService.presentCustomToast(error.data);
      }
    });
    this.suscriptionService.add(this, subscription);
  }

  openProducts(id: string) {
    this.router.navigate(['/folder/shop/products', id])
  }

  searchItem(event: any) {
    const inputTerm = event.target.value;
    if (inputTerm.length != 0) {
      const suscription = this.productService.getProductsByTerm(inputTerm).subscribe({
        next: (data) => {
          if (data.message === 'Error') {
            this.alertService.presentCustomToast(data.data);
          } else {
            this.router.navigate(['/folder/shop/products', inputTerm], { state: { products: data.data } });
            this.searchBar.value = '';
          }
        },
        error: (error) => {
          this.alertService.presentCustomToast(error.data);
        }
      })
      this.suscriptionService.add(this, suscription);
    }
  }
}
