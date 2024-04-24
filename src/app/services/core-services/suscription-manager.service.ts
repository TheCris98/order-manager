import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuscriptionManagerService {
  private subscriptionsMap: Map<string, Subscription[]> = new Map();

  constructor() { }

  add(id: any, subscription: Subscription, key: string) {
    const compositeKey = `${id.constructor.name}_${key}`;
    this.unsubscribe(compositeKey); // Desuscribir la anterior si existe
    this.subscriptionsMap.set(compositeKey, [subscription]);
  }

  unsubscribe(compositeKey: string) {
    const subs = this.subscriptionsMap.get(compositeKey);
    if (subs) {
      subs.forEach(sub => sub.unsubscribe());
      this.subscriptionsMap.delete(compositeKey);
    }
  }

  // Método para desuscribir todas las suscripciones asociadas a un componente
  unsubscribeAll(id: any) {
    const prefix = `${id.constructor.name}_`;
    Array.from(this.subscriptionsMap.keys())
      .filter(key => key.startsWith(prefix))
      .forEach(key => this.unsubscribe(key));
  }
}
