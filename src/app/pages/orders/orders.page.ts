import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ModalWrapperComponent } from 'src/app/components/modal-wrapper/modal-wrapper.component';
import { Order } from 'src/app/models/navigation';
import { AlertsService } from 'src/app/services/core-services/alerts.service';
import { SuscriptionManagerService } from 'src/app/services/core-services/suscription-manager.service';
import { AuthFirebaseService } from 'src/app/services/firebase-services/auth-firebase.service';
import { OrdersFirebaseService } from 'src/app/services/firebase-services/orders-firebase.service';
import { OrderDetailsComponent } from './components/order-details/order-details.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit, OnDestroy {
  orderItems: Order[] = [];
  constructor(
    private orderService: OrdersFirebaseService,
    private authService: AuthFirebaseService,
    private subscriptionService: SuscriptionManagerService,
    private alertService: AlertsService,
    private modalController: ModalController,
  ) { }

  ngOnInit() {
    this.getOrderItems();
  }

  ngOnDestroy() {
    this.subscriptionService.unsubscribeAll(this);
  }

  getOrderItems() {
    const subscription = this.orderService.getOrdersByCustomer(this.authService.loadUserFromLocalStorage().uid).subscribe({
      next: (data) => {
        this.orderItems = data.data;
        console.log('orders', this.orderItems)
      },
      error: (error) => {
        this.alertService.presentCustomToast(error.data);
      }
    })
    this.subscriptionService.add(this, subscription, 'getOrders');
  }

  async openDetails(element: Order) {
    const modal = await this.modalController.create({
      component: ModalWrapperComponent,
      componentProps: {
        component: OrderDetailsComponent,
        componentProps: { order: element },
        title: 'Detalle de la Orden'
      }
    });
    return await modal.present();
  }
}
