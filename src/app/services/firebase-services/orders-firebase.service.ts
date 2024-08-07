import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, catchError, combineLatest, from, map, of, switchMap } from 'rxjs';
import { Order, OrderDetail, Product, Response, Table, UserData } from 'src/app/models/navigation';
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

  saveOrder(order: Order): Observable<Response> {
    return from(this.firestore.firestore.runTransaction(async transaction => {
      const orderRef = this.firestore.collection('orders').doc(order.uid);

      console.log("Iniciando transacción para guardar la orden");

      // Guardar todas las referencias a las lecturas
      const productReads = order.details.map(detail => {
        const mainProductRef = this.firestore.collection('products').doc(detail.product.uid);
        return transaction.get(mainProductRef.ref).then(productDoc => {
          if (!productDoc.exists) {
            throw new Error(`Product with ID ${detail.product.uid} does not exist.`);
          }
          return {
            productDoc,
            productRef: mainProductRef,
            detail
          };
        });
      });

      // Ejecutar todas las lecturas primero
      const productDataList = await Promise.all(productReads);

      // Ahora realizar las escrituras
      transaction.set(orderRef.ref, {
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        orderedBy: order.orderedBy.uid
      });

      for (const [index, detail] of order.details.entries()) {
        const detailID = `${order.uid}-${index + 1}`;
        const detailRef = orderRef.collection('details').doc(detailID);

        console.log(`Guardando el detalle ${detailID}`);

        transaction.set(detailRef.ref, {
          quantity: detail.quantity,
          indication: detail.indication,
          requestedDate: detail.requestedDate,
          state: detail.state
        });

        // Guardar el producto asociado al detalle en su subcolección
        const productRef = detailRef.collection('product').doc(detail.product.uid);
        console.log(`Guardando el producto asociado al detalle ${detail.product.uid}`);

        transaction.set(productRef.ref, {
          name: detail.product.name,
          description: detail.product.description,
          price: detail.product.price,
          image: detail.product.image,
          categorie: detail.product.categorie,
          state: detail.product.state,
          stock: detail.product.stock
        });
      }

      // Actualizar el stock del producto en la colección principal de productos
      for (const { productDoc, productRef, detail } of productDataList) {
        const productData = productDoc.data() as Product;
        const newStock = productData.stock - detail.quantity;

        console.log(`Actualizando el stock del producto ${detail.product.uid} a ${newStock}`);

        transaction.update(productRef.ref, { stock: newStock });
      }

      // Guardar la mesa en su subcolección sin incluir el UID como atributo
      const tableRef = orderRef.collection('table').doc(order.table.uid);
      console.log(`Guardando la mesa ${order.table.uid}`);
      transaction.set(tableRef.ref, {
        number: order.table.number,
        capacity: order.table.capacity,
        status: order.table.status
      });

      // Guardar los datos del usuario que ordenó en su subcolección sin incluir el UID como atributo
      const userRef = orderRef.collection('orderedBy').doc(order.orderedBy.uid);
      console.log(`Guardando el usuario ${order.orderedBy.uid}`);
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
      console.log("Transacción completada");
      return { data: true, message: 'Ok' };
    })).pipe(
      catchError(error => {
        console.error("Error en la transacción:", error);
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

      // Obtener la colección de detalles de la orden existente
      const detailsRef = this.firestore.collection('orders').doc(order.uid).collection('details').ref;
      const existingDetailsSnapshot = await detailsRef.get();
      const existingDetailIds = existingDetailsSnapshot.docs.map(doc => doc.id);

      // Guardar todas las referencias a las lecturas de productos
      const productReads = order.details.map(detail => {
        const mainProductRef = this.firestore.collection('products').doc(detail.product.uid).ref;
        return transaction.get(mainProductRef).then(productDoc => {
          if (!productDoc.exists) {
            throw new Error(`Product with ID ${detail.product.uid} does not exist.`);
          }
          return {
            productDoc,
            productRef: mainProductRef,
            detail
          };
        });
      });

      // Ejecutar todas las lecturas primero
      const productDataList = await Promise.all(productReads);

      // Realizar las escrituras después de todas las lecturas
      // Actualizar el total del monto de la orden
      const currentOrderData = orderDoc.data() as Order;
      const newTotalAmount = currentOrderData.totalAmount + order.totalAmount;
      transaction.update(orderRef, { totalAmount: newTotalAmount });

      // Generar una nueva ID única para el detalle
      const generateNewDetailID = (orderUid: string, existingIds: string[], index: number) => {
        let newId;
        let idExists;
        do {
          newId = `${orderUid}-${index}`;
          idExists = existingIds.includes(newId);
          index++;
        } while (idExists);
        return newId;
      };

      // Agregar los nuevos detalles a la subcolección `details`
      let index = existingDetailIds.length + 1;
      for (const detail of order.details) {
        const detailID = generateNewDetailID(order.uid, existingDetailIds, index);
        existingDetailIds.push(detailID); // Añadir la nueva ID a la lista de IDs existentes para futuras verificaciones
        const detailDocRef = detailsRef.doc(detailID);
        transaction.set(detailDocRef, {
          indication: detail.indication,
          quantity: detail.quantity,
          requestedDate: detail.requestedDate,
          state: detail.state
        });

        // Guardar el producto asociado al detalle en su subcolección
        const productDocRef = detailDocRef.collection('product').doc(detail.product.uid);
        transaction.set(productDocRef, {
          name: detail.product.name,
          description: detail.product.description,
          price: detail.product.price,
          image: detail.product.image,
          categorie: detail.product.categorie,
          state: detail.product.state,
          stock: detail.product.stock
        });

        index++; // Incrementar el índice para la próxima ID
      }

      // Actualizar el stock del producto en la colección principal de productos
      for (const { productDoc, productRef, detail } of productDataList) {
        const productData = productDoc.data() as Product;
        const newStock = productData.stock - detail.quantity;

        console.log(`Actualizando el stock del producto ${detail.product.uid} a ${newStock}`);

        transaction.update(productRef, { stock: newStock });
      }

      return { data: true, message: 'Ok' };
    })).pipe(
      catchError(error => {
        console.error("Error en la transacción:", error);
        return of({ data: this.errorFireBase.parseError(error.code), message: 'Error' });
      })
    );
  }

  getOrdersByCustomer(customerID: string): Observable<Response> {
    return this.firestore.collection<Order>('orders', ref => ref.where('orderedBy', '==', customerID))
      .snapshotChanges()
      .pipe(
        switchMap(actions => {
          if (actions.length === 0) {
            return of({ data: [], message: 'No orders found' });
          }

          const orderObservables = actions.map(a => {
            const orderData = a.payload.doc.data() as Order;
            const date = orderData.orderDate as any;
            const orderID = a.payload.doc.id;

            // Recuperar detalles y su producto asociado, aplicando el filtro directamente en Firestore
            const detailsWithProduct$ = this.firestore.collection<OrderDetail>(`${a.payload.doc.ref.path}/details`, ref => ref.where('state', '!=', 'F'))
              .snapshotChanges()
              .pipe(
                switchMap(detailActions => {
                  if (detailActions.length === 0) {
                    return of([]);
                  }
                  return combineLatest(
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
                  );
                })
              );

            const table$ = this.firestore.collection(`${a.payload.doc.ref.path}/table`).valueChanges({ idField: 'uid' });
            const orderedBy$ = this.firestore.collection(`${a.payload.doc.ref.path}/orderedBy`).valueChanges({ idField: 'uid' });

            return combineLatest([detailsWithProduct$, table$, orderedBy$]).pipe(
              map(([details, table, orderedBy]) => {
                if (details.length === 0) {
                  // Si no hay detalles válidos, no incluir la orden
                  return null;
                }
                return {
                  ...orderData,
                  orderDate: date.toDate(),
                  uid: orderID,
                  details: details as OrderDetail[],
                  table: table.length > 0 ? table[0] : {},
                  orderedBy: orderedBy.length > 0 ? orderedBy[0] : {}
                };
              })
            );
          });

          return combineLatest(orderObservables).pipe(
            map(orders => {
              const filteredOrders = orders.filter(order => order !== null); // Filtrar órdenes válidas
              return { data: filteredOrders, message: 'Ok' };
            })
          );
        }),
        catchError(error => {
          return of({ data: this.errorFireBase.parseError(error.code), message: 'Error' });
        })
      );
  }

  getBasicOrdersByCustomer(customerID: string): Observable<Response> {
    return this.firestore.collection<Order>('orders', ref => ref.where('orderedBy', '==', customerID))
      .snapshotChanges()
      .pipe(
        switchMap(actions => {
          if (actions.length === 0) {
            return of({ data: [], message: 'No orders found' });
          }

          const orderObservables = actions.map(a => {
            const orderData = a.payload.doc.data() as Order;
            const orderID = a.payload.doc.id;
            const date = orderData.orderDate as any;  // Transformar orderDate a Date

            // Recuperar detalles y verificar si hay al menos uno que no esté en estado "F"
            return this.firestore.collection<OrderDetail>(`${a.payload.doc.ref.path}/details`, ref => ref.where('state', '!=', 'F'))
              .get()
              .pipe(
                switchMap(detailsSnapshot => {
                  if (detailsSnapshot.empty) {
                    // Si no hay detalles válidos, no incluir la orden
                    return of(null);
                  }

                  // Recuperar los datos de la mesa
                  return this.firestore.collection(`${a.payload.doc.ref.path}/table`).valueChanges().pipe(
                    map(table => {
                      return {
                        ...orderData,
                        orderDate: date.toDate(),  // Usar la fecha transformada
                        uid: orderID,
                        table: table.length > 0 ? table[0] : {}
                      };
                    })
                  );
                })
              );
          });

          return combineLatest(orderObservables).pipe(
            map(orders => {
              const filteredOrders = orders.filter(order => order !== null); // Filtrar órdenes válidas
              return { data: filteredOrders, message: 'Ok' };
            })
          );
        }),
        catchError(error => {
          return of({ data: this.errorFireBase.parseError(error.code), message: 'Error' });
        })
      );
  }

  getOrderWithDetails(orderID: string): Observable<Response> {
    return this.firestore.collection<Order>('orders').doc(orderID).snapshotChanges().pipe(
      switchMap(a => {
        const orderData = a.payload.data() as Order;
        const orderID = a.payload.id;
        const date = (orderData.orderDate as any).toDate();  // Transformar orderDate a Date

        // Consultas en paralelo
        const detailsWithProduct$ = this.firestore.collection<OrderDetail>(`${a.payload.ref.path}/details`, ref => ref.where('state', '!=', 'F'))
          .snapshotChanges()
          .pipe(
            switchMap(detailActions => {
              if (detailActions.length === 0) {
                return of([]);
              }
              // Consultas en paralelo para los productos asociados a los detalles
              const detailObservables = detailActions.map(detailAction => {
                const detailDoc = detailAction.payload.doc;
                const detailData = detailDoc.data() as OrderDetail;
                const detailID = detailDoc.id;
                return this.firestore.collection(`${detailDoc.ref.path}/product`).valueChanges().pipe(
                  map(products => ({
                    ...detailData,
                    product: products[0], // Tomar el primer producto
                    uid: detailID
                  }))
                );
              });
              return combineLatest(detailObservables);
            })
          );

        const table$ = this.firestore.collection<Table>(`${a.payload.ref.path}/table`).valueChanges().pipe(
          map(tables => tables.length > 0 ? tables[0] : {
            uid: '',
            capacity: 0,
            number: 0,
            status: ''
          } as Table)
        );

        const orderedBy$ = this.firestore.collection<UserData>(`${a.payload.ref.path}/orderedBy`).valueChanges().pipe(
          map(users => users.length > 0 ? users[0] : {
            uid: '',
            email: '',
            name: '',
            lastname: '',
            address: '',
            phone: '',
            role: '',
            avatar: '',
            creationDate: new Date()
          } as UserData)
        );

        // Combinar todas las consultas paralelas
        return combineLatest([detailsWithProduct$, table$, orderedBy$]).pipe(
          map(([details, table, orderedBy]) => {
            const orderWithDetails: Order = {
              ...orderData,
              orderDate: date,  // Usar la fecha transformada
              uid: orderID,
              details: details as OrderDetail[],
              table: table,
              orderedBy: orderedBy
            };
            return { data: orderWithDetails, message: 'Ok' } as Response;
          })
        );
      }),
      catchError(error => {
        console.error('Error fetching order details:', error);
        return of({ data: null, message: `Error: ${error.message}` } as Response);
      })
    );
  }

  deleteOrderDetail(orderUid: string, detailUid: string): Observable<Response> {
    return from(this.firestore.firestore.runTransaction(async transaction => {
      const orderRef = this.firestore.collection('orders').doc(orderUid).ref;

      // Obtener el documento de la orden
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      // Obtener el detalle especificado
      const detailRef = orderRef.collection('details').doc(detailUid);
      const detailDoc = await transaction.get(detailRef);
      if (!detailDoc.exists) {
        throw new Error('Detail not found');
      }

      // Obtener los datos del detalle
      const detailData = detailDoc.data();
      if (!detailData) {
        throw new Error('Detail data is missing');
      }

      // Obtener el producto desde la subcolección 'product' del detalle
      const productCollectionRef = detailRef.collection('product');
      const productSnapshot = await productCollectionRef.get();
      if (productSnapshot.empty) {
        throw new Error('Product not found in detail subcollection');
      }

      const productDoc = productSnapshot.docs[0];
      const productData = productDoc.data() as Product;

      // Obtener el documento del producto en la colección principal 'products'
      const mainProductRef = this.firestore.collection('products').doc(productDoc.id).ref;
      const mainProductDoc = await transaction.get(mainProductRef);
      if (!mainProductDoc.exists) {
        throw new Error(`Product with ID ${productDoc.id} does not exist.`);
      }

      const mainProductData = mainProductDoc.data() as Product;

      // Actualizar el stock del producto
      const newStock = mainProductData.stock + detailData['quantity'];
      transaction.update(mainProductRef, { stock: newStock });

      // Recalcular el total de la orden
      const newTotalAmount = (orderDoc.data() as any).totalAmount - (detailData['quantity'] * productData.price);
      transaction.update(orderRef, { totalAmount: newTotalAmount });

      // Eliminar todos los documentos en la subcolección 'product'
      const batch = this.firestore.firestore.batch();
      productSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Eliminar el detalle especificado
      transaction.delete(detailRef);

      return orderUid;
    })).pipe(
      switchMap(async orderUid => {
        const orderRef = this.firestore.collection('orders').doc(orderUid).ref;
        const remainingDetailsSnapshot = await orderRef.collection('details').get();
        if (remainingDetailsSnapshot.empty) {
          console.log("NO HAY MAS DETALLES");

          // Eliminar subcolección 'orderedBy'
          const orderedBySnapshot = await orderRef.collection('orderedBy').get();
          const batch = this.firestore.firestore.batch();
          orderedBySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });

          // Eliminar subcolección 'table'
          const tableSnapshot = await orderRef.collection('table').get();
          tableSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });

          await batch.commit();

          // Eliminar la orden
          await this.firestore.collection('orders').doc(orderUid).delete();
        }

        return { data: true, message: 'Ok' };
      }),
      catchError(error => {
        console.error('Transaction failed: ', error.code);
        return of({ data: this.errorFireBase.parseError(error.code), message: 'Error' });
      })
    );
  }

  toggleStatusDetail(orderUid: string, detailUid: string, newState: string): Observable<Response> {
    return from(this.firestore.firestore.runTransaction(async transaction => {
      const orderRef = this.firestore.collection('orders').doc(orderUid).ref;
      // Obtener el documento de la orden
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      // Obtener el detalle especificado
      const detailRef = orderRef.collection('details').doc(detailUid);
      const detailDoc = await transaction.get(detailRef);
      if (!detailDoc.exists) {
        throw new Error('Detail not found');
      }

      // Actualizar el estado del detalle
      transaction.update(detailRef, { state: newState });

      return { data: true, message: 'Ok' };
    })).pipe(
      catchError(error => {
        console.error('Transaction failed: ', error);
        return of({ data: this.errorFireBase.parseError(error.code), message: 'Error' });
      })
    );
  }

}
