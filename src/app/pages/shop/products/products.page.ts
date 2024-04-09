import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from 'src/app/models/navigation';
import { AlertsService } from 'src/app/services/alerts.service';
import { ProductsFirebaseService } from 'src/app/services/products-firebase.service';
import { SuscriptionManagerService } from 'src/app/services/suscription-manager.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit, OnDestroy {

  products: Product[] = [];

  constructor(
    private productService: ProductsFirebaseService,
    private route: ActivatedRoute,
    private alertService: AlertsService,
    private suscriptionService: SuscriptionManagerService,
  ) { }

  ngOnInit() {
    this.getProducts();
  }

  ngOnDestroy() {
    this.suscriptionService.unsubscribe(this);
  }

  /* TODO: Agregar funcionalidad para el carrito (Terminar con este componente en pocas) */
  getProducts() {
    if (history.state.products) {
      this.products = history.state.products
    } else {
      const id = this.route.snapshot.paramMap.get('id') as string;
      const subscription = this.productService.getProductsByCategory(id).subscribe({
        next: (data) => {
          this.products = data.data;
          console.log(this.products);
        },
        error: (error) => {
          this.alertService.presentCustomToast(error.data);
        }
      });
      this.suscriptionService.add(this, subscription);
    }
  }
}
