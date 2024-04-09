import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { Product, Response } from '../models/navigation';
import { ErrorsFirebaseService } from './errors-firebase.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsFirebaseService {

  constructor(private fireStore: AngularFirestore, private errorFirebase: ErrorsFirebaseService) { }

  getProductsByCategory(categoryId: string): Observable<Response> {
    return this.fireStore.collection('products', ref => ref
      .where('categoria', '==', categoryId)
      .where('estado', '==', 'A')
      .where('stock', '>', 0))
      .snapshotChanges()
      .pipe(
        map(actions => {
          const products = actions.map(a => {
            const data = a.payload.doc.data() as any;
            const uid = a.payload.doc.id;
            const product: Product = {
              uid: uid,
              name: data.nombre,
              description: data.descripcion,
              price: data.precio,
              image: data.imagen,
              categorie: data.categoria,
              state: data.estado,
              stock: data.stock
            };
            return product;
          });
          return { data: products, message: 'Ok' };
        }),
        catchError(error => {
          console.error(error);
          return of({ data: this.errorFirebase.parseError(error.code), message: 'Error' });
        })
      );
  }

  getProductsByTerm(searchTerm: string): Observable<Response> {
    return this.fireStore.collection('products', ref => ref
      .orderBy('nombre')
      .where('nombre', '>=', searchTerm)
      .where('nombre', '<=', searchTerm + '\uf8ff'))
      .snapshotChanges()
      .pipe(
        map(actions => {
          const products = actions.map(a => {
            const data = a.payload.doc.data() as any;
            const uid = a.payload.doc.id;
            const product: Product = {
              uid: uid,
              name: data.nombre,
              description: data.descripcion,
              price: data.precio,
              image: data.imagen,
              categorie: data.categoria,
              state: data.estado,
              stock: data.stock
            };
            return product;
          });
          if(products.length === 0){
            return { data: this.errorFirebase.parseError('custom/not-item-found'), message: 'Error' };
          }
          return { data: products, message: 'Ok' };
        }),
        catchError(error => {
          console.error(error);
          return of({ data: this.errorFirebase.parseError(error.code), message: 'Error' });
        })
      );
  }
}

