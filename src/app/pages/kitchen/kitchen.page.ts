import { Component, OnDestroy, OnInit } from '@angular/core';
import { Order, OrderDetail } from 'src/app/models/navigation';
import { AlertsService } from 'src/app/services/core-services/alerts.service';
import { SuscriptionManagerService } from 'src/app/services/core-services/suscription-manager.service';
import { OrdersFirebaseService } from 'src/app/services/firebase-services/orders-firebase.service';

@Component({
  selector: 'app-kitchen',
  templateUrl: './kitchen.page.html',
  styleUrls: ['./kitchen.page.scss'],
})
export class KitchenPage implements OnInit, OnDestroy {
  currentOrders: Order[] = [];
  constructor(
    private ordersService: OrdersFirebaseService,
    private subscriptionService: SuscriptionManagerService,
    private alertsService: AlertsService
  ) { }

  ngOnInit() {
    this.getCurrentOrders();
  }

  ngOnDestroy() {
    this.subscriptionService.unsubscribeAll(this);
  }

  getCurrentOrders() {
    const subscription = this.ordersService.getCurrentOrders().subscribe({
      next: (data) => {
        this.currentOrders = data.data
        console.log(this.currentOrders)
      },
      error: (error) => {
        console.log(error.data)
      }
    })
    this.subscriptionService.add(this, subscription, 'getCurrentOrders');
  }

  toggleStatusDetail(item: OrderDetail, newState: string) {
    // Extraer el ID de la orden eliminando el sufijo después del último guión "-"
    const orderUid = item.uid.split('-').slice(0, -1).join('-');
    const detailUid = item.uid; // ID del detalle completo
    const nameProd = item.product.name;
    let key = ''
    switch (newState) {
      case 'P':
        key = 'se empezó a preparar';
        break;
      case 'L':
        key = 'está listo para entregar.';
        break;
    }

    const subscription = this.ordersService.toggleStatusDetail(orderUid, detailUid, newState).subscribe({
      next: (data) => {
        this.alertsService.presentSimpleToast(nameProd + ' ' + key, 1000);
      },
      error: (error) => {
        this.alertsService.presentSimpleToast(error.data);
      }
    });
    this.subscriptionService.add(this, subscription, 'toggleStatusDetail');
  }


}
