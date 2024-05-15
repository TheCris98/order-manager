import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, catchError, combineLatest, from, map, of, switchMap } from 'rxjs';
import { Order, OrderDetail, Product, Response } from 'src/app/models/navigation';
import { ErrorsFirebaseService } from '../core-services/errors-firebase.service';

@Injectable({
  providedIn: 'root'
})
export class OrdersFirebaseService {

  constructor(
    private firestore: AngularFirestore,
    private errorFireBase: ErrorsFirebaseService,
  ) { }

  async createOrder(): Promise<string> {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderRef = this.firestore.collection('orders');

    return this.firestore.firestore.runTransaction(async transaction => {
      let newOrderId = "";
      let attempt = 0;
      let available = false;
      while (!available) {
        newOrderId = `ORD-${datePrefix}-${(attempt + 1).toString().padStart(3, '0')}`;
        const newOrderDocRef = orderRef.doc(newOrderId).ref;
        const docSnapshot = await transaction.get(newOrderDocRef);
        if (!docSnapshot.exists) {
          available = true;
          transaction.set(newOrderDocRef, {}); // Solo crea el documento con ID sin contenido
        } else {
          attempt++;
        }
      }
      return newOrderId; // Retorna el ID del nuevo pedido
    });
  }

  checkOrderExists(orderId: string): Observable<Response> {
    return this.firestore.doc(`orders/${orderId}`).snapshotChanges().pipe(
      map(snapshot => {
        if (snapshot.payload.exists) {
          return { data: true, message: 'Ok' }; // El documento existe
        } else {
          return { data: this.errorFireBase.parseError('custom/not-id-found'), message: 'Not Found' }; // El documento no existe
        }
      }),
      catchError(error => {
        // Maneja el error aquí si es necesario
        return of({ data: this.errorFireBase.parseError(error.code), message: 'Error' });
      })
    );
  }

  /* TODO: Actualizar el stock del producto */
  saveOrder(order: Order): Observable<Response> {
    return from(this.firestore.firestore.runTransaction(async transaction => {
      const orderRef = this.firestore.collection('orders').doc(order.uid);

      // Guardar la orden sin incluir el UID como atributo
      transaction.set(orderRef.ref, {
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        orderedBy: order.orderedBy.uid
      });

      // Guardar cada detalle de la orden
      order.details.forEach((detail, index) => {
        const detailID = `${order.uid}-${index + 1}`;
        const detailRef = orderRef.collection('details').doc(detailID);
        transaction.set(detailRef.ref, {
          quantity: detail.quantity,
          indication: detail.indication,
          requestedDate: detail.requestedDate,
          state: detail.state
        });

        // Guardar el producto asociado al detalle en su subcolección
        const productRef = detailRef.collection('product').doc(detail.product.uid);
        transaction.set(productRef.ref, {
          name: detail.product.name,
          description: detail.product.description,
          price: detail.product.price,
          image: detail.product.image,
          categorie: detail.product.categorie,
          state: detail.product.state,
          stock: detail.product.stock
        });
      });

      // Guardar la mesa en su subcolección sin incluir el UID como atributo
      const tableRef = orderRef.collection('table').doc(order.table.uid);
      transaction.set(tableRef.ref, {
        number: order.table.number,
        capacity: order.table.capacity,
        status: order.table.status
      });

      // Guardar los datos del usuario que ordenó en su subcolección sin incluir el UID como atributo
      const userRef = orderRef.collection('orderedBy').doc(order.orderedBy.uid);
      transaction.set(userRef.ref, {
        email: order.orderedBy.email,
        name: order.orderedBy.name,
        lastname: order.orderedBy.lastname,
        address: order.orderedBy.address,
        phone: order.orderedBy.phone,
        role: order.orderedBy.role,
        avatar: order.orderedBy.avatar,
        creationDate: order.orderedBy.creationDate
      });
      return { data: true, message: 'Ok' };
    })).pipe(
      catchError(error => {
        return of({ data: this.errorFireBase.parseError(error.code), message: 'Error' });
      })
    );
  }

  updateOrder(order: Order): Observable<Response> {
    return from(this.firestore.firestore.runTransaction(async transaction => {
      const orderRef = this.firestore.collection('orders').doc(order.uid).ref;

      // Obtener el documento de la orden
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      // Actualizar el total del monto de la orden
      const currentOrderData = orderDoc.data() as Order;
      const newTotalAmount = currentOrderData.totalAmount + order.totalAmount;
      transaction.update(orderRef, { totalAmount: newTotalAmount });

      // Obtener la colección de detalles de la orden existente
      const detailsRef = orderRef.collection('details');
      const existingDetailsSnapshot = await detailsRef.get();
      const existingDetailsCount = existingDetailsSnapshot.size;

      // Agregar los nuevos detalles a la subcolección `details`
      for (const detail of order.details) {
        const detailID = `${order.uid}-${existingDetailsCount + 1}`;
        const detailRef = detailsRef.doc(detailID);
        transaction.set(detailRef, {
          indication: detail.indication,
          quantity: detail.quantity,
          requestedDate: detail.requestedDate,
          state: detail.state
        });

        // Guardar el producto asociado al detalle en su subcolección
        const productRef = detailRef.collection('product').doc(detail.product.uid);
        transaction.set(productRef, {
          name: detail.product.name,
          description: detail.product.description,
          price: detail.product.price,
          image: detail.product.image,
          categorie: detail.product.categorie,
          state: detail.product.state,
          stock: detail.product.stock
        });
      }

      return { data: true, message: 'Ok' };
    })).pipe(
      catchError(error => {
        return of({ data: this.errorFireBase.parseError(error.code), message: 'Error' });
      })
    );
  }

  getOrdersByCustomer(customerID: string): Observable<Response> {
    /* TODO: De momento obtendré todas las órdenes del solicitante, luego defino que 
    estrategia usar para establecer si una orden está finalizada o aún en curso.
    Opciones:
    1. Agregar otro parámetro a la interfaz Order para poner 'status'='A' o 'F'
    2. Analizar todos los detalles y si todos son 'status'='F' entonces la orden se descarta, sino, se toma en cuenta la orden con solo los detalles en != 'F'
    */
    return this.firestore.collection<Order>('orders', ref => ref.where('orderedBy', '==', customerID))
      .snapshotChanges()
      .pipe(
        switchMap(actions => {
          if (actions.length === 0) {
            return of({ data: [], message: 'No orders found' });
          }
          // Procesar cada acción para mapear los datos del documento y subcolecciones
          const orderObservables = actions.map(a => {
            const orderData = a.payload.doc.data() as Order;
            const date = orderData.orderDate as any;
            const orderID = a.payload.doc.id;

            // Recuperar detalles y su producto asociado
            const detailsWithProduct$ = this.firestore.collection<OrderDetail>(`${a.payload.doc.ref.path}/details`).snapshotChanges().pipe(
              switchMap(detailActions => combineLatest(
                detailActions.map(detailAction => {
                  const detailData = detailAction.payload.doc.data() as OrderDetail;
                  const detailID = detailAction.payload.doc.id;
                  // Asumimos que hay un solo documento en la colección de productos
                  return this.firestore.collection(`${detailAction.payload.doc.ref.path}/product`).valueChanges().pipe(
                    map(products => ({
                      ...detailData,
                      product: products[0], // Tomar el primer producto
                      uid: detailID
                    }))
                  );
                })
              ))
            );

            const table$ = this.firestore.collection(`${a.payload.doc.ref.path}/table`).valueChanges({ idField: 'uid' });
            const orderedBy$ = this.firestore.collection(`${a.payload.doc.ref.path}/orderedBy`).valueChanges({ idField: 'uid' });

            return combineLatest([detailsWithProduct$, table$, orderedBy$]).pipe(
              map(([details, table, orderedBy]) => ({
                ...orderData,
                orderDate: date.toDate(),
                uid: orderID,
                details: details as OrderDetail[],
                table: table.length > 0 ? table[0] : {},
                orderedBy: orderedBy.length > 0 ? orderedBy[0] : {}
              }))
            );
          });

          return combineLatest(orderObservables).pipe(
            map(orders => ({ data: orders, message: 'Ok' }))
          );
        }),
        catchError(error => {
          return of({ data: this.errorFireBase.parseError(error.code), message: 'Error' });
        })
      );
  }

  deleteOrderDetail(orderUid: string, detailUid: string): Observable<Response> {
    return from(this.firestore.firestore.runTransaction(async transaction => {
      const orderRef = this.firestore.collection('orders').doc(orderUid);

      // Obtener el documento de la orden
      const orderDoc = await transaction.get(orderRef.ref);
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      // Eliminar el detalle especificado
      const detailRef = orderRef.collection('details').doc(detailUid);
      transaction.delete(detailRef.ref);

      return { data: true, message: 'Ok' };
    })).pipe(
      catchError(error => {
        console.error('Transaction failed: ', error);
        return of({ data: this.errorFireBase.parseError(error.code), message: 'Error' });
      })
    );
  }
}
