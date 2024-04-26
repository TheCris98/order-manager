import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order, OrderDetail, Table } from 'src/app/models/navigation';
import { AlertsService } from 'src/app/services/core-services/alerts.service';
import { LocalStorageService } from 'src/app/services/core-services/local-storage.service';
import { SuscriptionManagerService } from 'src/app/services/core-services/suscription-manager.service';
import { TimeZoneService } from 'src/app/services/core-services/time-zone.service';
import { AuthFirebaseService } from 'src/app/services/firebase-services/auth-firebase.service';
import { OrdersFirebaseService } from 'src/app/services/firebase-services/orders-firebase.service';
import { TablesFirebaseService } from 'src/app/services/firebase-services/tables-firebase.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit, OnDestroy {

  /* Atributos del Maestro */
  orderID: string = '';
  cartItems: OrderDetail[] = [];
  selectedTable: Table = {
    uid: '',
    capacity: 0,
    number: 0,
    status: ''
  };
  totalAmount: number = 0;
  dateTime: Date = new Date();

  tables: Table[] = [];

  constructor(
    private localStorageService: LocalStorageService,
    private tableService: TablesFirebaseService,
    private alertService: AlertsService,
    private subscriptionService: SuscriptionManagerService,
    private timeZoneService: TimeZoneService,
    private orderService: OrdersFirebaseService,
    private authService: AuthFirebaseService,
    private router: Router
  ) { }

  ngOnInit() {
    this.getCartItems();
    this.getTablesOfRestaurant();
  }

  ngOnDestroy() {
    this.subscriptionService.unsubscribeAll(this);
  }

  getCartItems() {
    this.cartItems = this.localStorageService.getLocalStorageItem('cart') || [];
    /* TODO: Realizar todo el tratamiento para manejar el para llevar 
    
    */
    this.getTotalAmount();
  }

  getTablesOfRestaurant() {
    const subscription = this.tableService.getTables().subscribe({
      next: (data) => {
        this.tables = data.data
      },
      error: (error) => {
        this.alertService.presentCustomToast(error.data);
      }
    });
    this.subscriptionService.add(this, subscription, 'getTables');
  }

  getTotalAmount() {
    this.totalAmount = this.cartItems.reduce((total, detail) => {
      return total + (detail.quantity * detail.product.price);
    }, 0)
  }
  /* TODO: Terminar con la implementacion de los clientes para el UI.*/
  addProduct(index: number) {
    this.cartItems[index].quantity = this.cartItems[index].quantity + 1;
    this.localStorageService.setLocalStorageItem('cart', this.cartItems);
    this.getTotalAmount();
  }

  restProduct(index: number) {
    this.cartItems[index].quantity = this.cartItems[index].quantity - 1;
    this.localStorageService.setLocalStorageItem('cart', this.cartItems);
    this.getTotalAmount();
  }

  deleteProduct(index: number) {
    this.cartItems.splice(index, 1);
    this.localStorageService.setLocalStorageItem('cart', this.cartItems);
    this.getTotalAmount();
    this.alertService.presentSimpleToast('Se ha retirado el producto');
  }

  onIndicationChange(event: any) {
    this.localStorageService.setLocalStorageItem('cart', this.cartItems);
  }

  clearAll() {
    this.alertService.presentSimpleToast('Se ha vaciado la orden');
    this.localStorageService.removeLocalStorageItem('cart');
    this.getCartItems()
  }

  async sendOrder() {
    this.alertService.presentConfirmation(
      '¿Finalizar Orden?',
      'Esta acción es irreversible',
      async () => {
        //AQUI REALIZAREMOS OPERACIONES ASÍNCRONAS PARA PODER ESTABLECER VALORES DEL MAESTRO
        //Se obtiene la hora a la que se ordena el pedido
        const response = await this.timeZoneService.getTimeByZone('America/Guayaquil');
        this.dateTime = response.message === 'Ok' ? response.data : response.data;
        //Se genera el ID de la orden, contemplando si se ha ingresado un ID
        if (this.orderID === '') {
          this.orderID = await this.orderService.createOrder();
          this.saveOrder();
        } else {
          const subscription = this.orderService.checkOrderExists(this.orderID).subscribe({
            next: (data) => {
              if (data.message === 'Ok') {
                this.updateOrder();
              } else {
                this.alertService.presentCustomToast(data.data);
              }
            },
            error: (error) => {
              this.alertService.presentCustomToast(error.data);
            }
          })
          this.subscriptionService.add(this, subscription, 'sendOrder');
        }
      })
  }

  /* Este para guardar una nueva orden */
  saveOrder() {
    const order: Order = {
      uid: this.orderID,
      details: this.cartItems,
      orderDate: this.dateTime,
      table: this.selectedTable,
      totalAmount: this.totalAmount,
      orderedBy: this.authService.loadUserFromLocalStorage()
    }
    const subscription = this.orderService.saveOrder(order).subscribe({
      next: (data) => {
        this.exit('Orden realizada con éxito');
      },
      error: (error) => {
        this.alertService.presentCustomToast(error.data);
      }
    })
    this.subscriptionService.add(this, subscription,'saveOrder');
  }

  /* Este para agregar más detalles a una orden */
  updateOrder() {
    const order: Order = {
      uid: this.orderID,
      details: this.cartItems,
      orderDate: this.dateTime,
      table: this.selectedTable,
      totalAmount: this.totalAmount,
      orderedBy: this.authService.loadUserFromLocalStorage()
    }
    const subscription = this.orderService.updateOrder(order).subscribe({
      next: (data)=>{
        this.exit('Productos agregados con éxito');
      },
      error: (error)=>{
        this.alertService.presentCustomToast(error.data);
      }
    })
    this.subscriptionService.add(this,subscription,'updateOrder');
  } 

  exit(message: string){
    this.alertService.presentSimpleToast(message);
    this.localStorageService.removeLocalStorageItem('cart');
    this.getCartItems()
    this.router.navigate(['/folder/orders']);
  }
}
