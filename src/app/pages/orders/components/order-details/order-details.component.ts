import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Order, OrderDetail } from 'src/app/models/navigation';
import { AlertsService } from 'src/app/services/core-services/alerts.service';
import { SuscriptionManagerService } from 'src/app/services/core-services/suscription-manager.service';
import { OrdersFirebaseService } from 'src/app/services/firebase-services/orders-firebase.service';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  @Input() order!: Order;

  constructor(
    private orderService: OrdersFirebaseService,
    private subscriptionService: SuscriptionManagerService,
    private alertService: AlertsService,
  ) {

  }

  ngOnInit() {
    console.log('Order in ngOnInit:', this.order);
  }

  ngOnDestroy() {
    this.subscriptionService.unsubscribeAll(this);
  }

  getOrderStatus(detail: OrderDetail): string {
    // Retorna el texto correspondiente al estado
    switch (detail.state) {
      case 'S':
        return 'Solicitado';
      case 'P':
        return 'Preparando';
      case 'L':
        return 'Listo';
      case 'E':
        return 'Entregado';
      default:
        return 'Desconocido';
    }
  }

  getStatusStyle(detail: OrderDetail): any {
    // Retorna el estilo correspondiente al estado
    switch (detail.state) {
      case 'S':
        return { 'background-color': 'gray', 'color': 'white', 'padding': '5px', 'border-radius': '5px' };
      case 'P':
        return { 'background-color': 'yellow', 'color': 'black', 'padding': '5px', 'border-radius': '5px' };
      case 'L':
        return { 'background-color': 'green', 'color': 'white', 'padding': '5px', 'border-radius': '5px' };
      case 'E':
        return { 'background-color': 'lightblue', 'color': 'black', 'padding': '5px', 'border-radius': '5px' };
      default:
        return {};
    }
  }

  toggleStatus(detail: OrderDetail) {
    /* TODO: Agregar la función en el servicio para actualizar el estado de ese detalle */
  }

  /* TODO: Controlar la funcionalidad para que se recalcule el total, se cierre el modal si no hay mas detalles, etc. */
  removeDetail(detail: OrderDetail) {
    // Implementa la lógica para eliminar el detalle del pedido.
    const subscription = this.orderService.deleteOrderDetail(this.order.uid, detail.uid).subscribe({
      next: (data) => {
        this.alertService.presentSimpleToast('Detalle eliminado exitosamente');
        this.order.details = this.order.details.filter(d => d !== detail);
      },
      error: (error) => {
        this.alertService.presentCustomToast(error.data);
      }
    })
    this.subscriptionService.add(this, subscription, 'deleteDetail');
  }
}
