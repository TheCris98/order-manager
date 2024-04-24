import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  getLocalStorageItem(key: string) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  setLocalStorageItem(key: string, value: any) {
    const item = JSON.stringify(value);
    localStorage.setItem(key, item);
  }

  removeLocalStorageItem(key: string) {
    localStorage.removeItem(key);
  }
  
}
