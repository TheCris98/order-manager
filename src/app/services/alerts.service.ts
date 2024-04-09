import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { FirebaseError } from '../models/navigation';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  constructor(
    private alertController : AlertController,
    private toastController : ToastController,
    ) { }
/* TODO: Ver el tema de usar promesas u observables, porque no aparecen los TOAST en algunos metodos a los que me suscribo */
  async presentSimpleAlert(message: string, duration: number = 2000) {
    const alert = await this.alertController.create({
      message: message,
      buttons: ['OK']
    });
    await alert.present();

    setTimeout(() => {
      alert.dismiss();
    }, duration);
  }

  async presentSimpleToast(message: string, duration: number = 2000) {
    const alert = await this.toastController.create({
      message: message,
      duration : duration,
      icon : 'checkmark-circle-outline',
      color : 'success'
    });
    await alert.present();

    setTimeout(() => {
      alert.dismiss();
    }, duration);
  }

  async presentCustomToast(error : FirebaseError, duration : number = 2000) {
    const alert = await this.toastController.create({
      message: error.message,
      duration : duration,
      icon: error.icon,
      color: error.color
    });
    await alert.present();

    setTimeout(() => {
      alert.dismiss();
    }, duration);
  }

}
