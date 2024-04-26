import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderDetail } from 'src/app/models/navigation';
import { AlertsService } from 'src/app/services/core-services/alerts.service';
import { ProductsFirebaseService } from 'src/app/services/firebase-services/products-firebase.service';
import { SuscriptionManagerService } from 'src/app/services/core-services/suscription-manager.service';
import { LocalStorageService } from 'src/app/services/core-services/local-storage.service';
import { TimeZoneService } from 'src/app/services/core-services/time-zone.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit, OnDestroy {

  products: OrderDetail[] = [];
  dateTime: Date = new Date();

  constructor(
    private productService: ProductsFirebaseService,
    private route: ActivatedRoute,
    private alertService: AlertsService,
    private suscriptionService: SuscriptionManagerService,
    private localStorageService: LocalStorageService,
    private timeZoneService: TimeZoneService
  ) { }

  ngOnInit() {
    this.getProducts();
  }

  ngOnDestroy() {
    this.suscriptionService.unsubscribeAll(this);
  }

  getProducts() {
    if (history.state.products) {
      this.products = history.state.products;
    } else {
      const id = this.route.snapshot.paramMap.get('id') as string;
      const subscription = this.productService.getProductsByCategory(id).subscribe({
        next: (data) => {
          this.products = data.data;
        },
        error: (error) => {
          this.alertService.presentCustomToast(error.data);
        }
      });
      this.suscriptionService.add(this, subscription, 'getProducts');
    }
  }

  async addToCart(element: OrderDetail) {
    const response = await this.timeZoneService.getTimeByZone('America/Guayaquil');
    this.dateTime = response.message === 'Ok' ? response.data : response.data;
    var cart = this.localStorageService.getLocalStorageItem('cart') || [];
    const itemIndex = cart.findIndex((item: OrderDetail) => item.product.uid === element.product.uid);
    if (itemIndex > -1) {
      this.alertService.presentConfirmation(
        '¿Desea reemplazarlo?',
        `Ya tiene ${cart[itemIndex].quantity} unidades en la orden.
        Nueva cantidad: ${element.quantity}`,
        () => {
          cart[itemIndex].quantity = element.quantity;
          cart[itemIndex].requestedDate = this.dateTime
          this.localStorageService.setLocalStorageItem('cart', cart);
          this.alertService.presentSimpleToast("Se ha actualizado tu orden", 1500);
        }
      );
    } else {
      element.requestedDate = this.dateTime
      cart.push(element);
      this.localStorageService.setLocalStorageItem('cart', cart);
      this.alertService.presentSimpleToast('Se ha añadido a tu orden', 1500);
    }
  }
}
