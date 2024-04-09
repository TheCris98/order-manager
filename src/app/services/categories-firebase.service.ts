import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Categorie, Response } from '../models/navigation';
import { Observable, catchError, map, of } from 'rxjs';
import { ErrorsFirebaseService } from './errors-firebase.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriesFirebaseService {

  constructor(private fireStore: AngularFirestore, private errorFirebase: ErrorsFirebaseService) { }

  getCategories(): Observable<Response> {
    var response: Response = {
      data: null,
      message: 'Void'
    }
    return this.fireStore.collection('categories').snapshotChanges().pipe(
      map(actions => {
        const categories = actions.map(a => {
          const data : any = a.payload.doc.data();
          const id = a.payload.doc.id;
          const mappedData: Categorie = {
            uid: id,
            name: data.nombre, 
            image: data.imagen
          };
          return mappedData;
        });
        response = {
          data: categories,
          message: 'Ok'
        }
        console.log('ok', response);
        return response; // Respuesta exitosa
      }),
      catchError(error => {
        // En caso de error, capturas el error y retornas un observable con una estructura de Response adecuada
        response = {
          data: this.errorFirebase.parseError(error.code),
          message: 'Error'
        }
        console.log('error', response);
        return of(response);
      })
    );
  }
}
