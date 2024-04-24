import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, catchError, map, of } from 'rxjs';
import { Response, Table } from 'src/app/models/navigation';
import { ErrorsFirebaseService } from '../core-services/errors-firebase.service';

@Injectable({
  providedIn: 'root'
})
export class TablesFirebaseService {

  constructor(
    private fireStore: AngularFirestore,
    private errorFirebase: ErrorsFirebaseService
  ) { }

  getTables(): Observable<Response> {
    return this.fireStore.collection('tables', ref => ref.orderBy('numero','asc')).snapshotChanges().pipe(
      map(actions => {
        const tables = actions.map(a => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          const table: Table = {
            uid: id,
            number: data.numero,
            capacity: data.capacidad,
            status: data.status
          };
          return table;
        });
        return { data: tables, message: 'Ok' }
      }),
      catchError(error => {
        console.error('Error getting tables:', error);
        return of({ data: this.errorFirebase.parseError(error.code), message: 'Error' });
      })
    );
  }
}
