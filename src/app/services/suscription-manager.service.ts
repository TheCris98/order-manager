import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuscriptionManagerService {
  private subscriptionsMap: Map<any, Subscription[]> = new Map();

  constructor() { }

  add(id: any, subscription: Subscription) {
    // Asegura que siempre haya un arreglo para este id.
    const subs = this.subscriptionsMap.get(id) || [];
    subs.push(subscription);
    this.subscriptionsMap.set(id, subs);
  }

  unsubscribe(id: any) {
    // Obtener las suscripciones para este id, si existen.
    const subs = this.subscriptionsMap.get(id);
    if (subs) {
      subs.forEach(subscription => subscription.unsubscribe());
      this.subscriptionsMap.delete(id);
    }
  }
}
