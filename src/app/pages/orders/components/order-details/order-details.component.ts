import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
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
  @Input() orderID!: string;
  @Output() closeModal = new EventEmitter<void>();
  order: Order = {
    uid: '',
    details: [
      {
        uid: 'detail1',
        product: {
          uid: 'product1',
          name: 'Producto de Ejemplo',
          description: 'Descripción del producto de ejemplo',
          price: 0,
          image: '',
          categorie: 'Categoría de Ejemplo',
          state: 'available',
          stock: 0
        },
        quantity: 1,
        indication: 'Indicación de ejemplo',
        requestedDate: new Date(),
        state: 'U'
      }
    ],
    table: { uid: '', capacity: 0, number: 0, status: '' },
    totalAmount: 0,
    orderDate: new Date(),
    orderedBy: { uid: '', email: '', name: '', lastname: '', address: '', phone: '', role: '', avatar: '', creationDate: new Date() }
  };

  constructor(
    private orderService: OrdersFirebaseService,
    private subscriptionService: SuscriptionManagerService,
    private alertService: AlertsService
  ) {

  }

  ngOnInit() {
    console.log('Order in ngOnInit:', this.orderID);
    this.getSelectedOrder();
  }

  ngOnDestroy() {
    this.subscriptionService.unsubscribeAll(this);
  }

  getSelectedOrder() {
    const subscription = this.orderService.getOrderWithDetails(this.orderID).subscribe({
      next: (data) => {
        this.order = data.data;
        console.log(this.order)
        if (this.order.details.length === 0) {
          this.closeModal.emit(); // Emite el evento para cerrar el modal
        }
      },
      error: (error) => {
        this.alertService.presentCustomToast(error.data);
      }
    })
    this.subscriptionService.add(this, subscription, 'getSelectedOrder');
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
    const subscription = this.orderService.toggleStatusDetail(this.order.uid, detail.uid, 'E').subscribe({
      next: (data) => {
        this.alertService.presentSimpleToast('Se entregó el pedido');
      },
      error: (error) => {
        this.alertService.presentCustomToast(error.data);
      }
    })
    this.subscriptionService.add(this, subscription, 'toggleStatus');
  }

  removeDetail(detail: OrderDetail) {
    this.subscriptionService.unsubscribeAll(this);
    const subscription = this.orderService.deleteOrderDetail(this.order.uid, detail.uid).subscribe({
      next: (data) => {
        this.alertService.presentSimpleToast('Detalle eliminado exitosamente');
        this.order.details = this.order.details.filter(d => d !== detail);
        if (this.order.details.length === 0) {
          this.closeModal.emit(); // Emite el evento para cerrar el modal
        } else {
          this.getSelectedOrder();
        }
      },
      error: (error) => {
        this.alertService.presentCustomToast(error.data);
      }
    });
    this.subscriptionService.add(this, subscription, 'deleteDetail');
  }
}
