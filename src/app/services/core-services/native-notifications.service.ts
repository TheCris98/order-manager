import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActionPerformed, PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { AlertsService } from './alerts.service';

@Injectable({
  providedIn: 'root'
})
export class NativeNotificationsService {
  private notificationSubject = new BehaviorSubject<any>(null);
  public notifications$ = this.notificationSubject.asObservable();

  constructor(
    private fireStore: AngularFirestore,
    private platform: Platform,
    private alertsService: AlertsService
  ) { }

  initializePushNotifications() {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      // Lógica para dispositivos móviles
      this.setupMobilePushNotifications();
    } else if (this.platform.is('desktop') || this.platform.is('pwa')) {
      // Lógica para la web
      this.setupWebNotifications();
    }
  }

  private setupMobilePushNotifications() {
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      } else {
        console.error('Permission not granted for push notifications');
      }
    });

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      //this.fireStore.collection('users').doc('user_id').set({ token: token.value });
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received: ' + JSON.stringify(notification));
      this.notificationSubject.next(notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      this.notificationSubject.next(notification.notification);
    });
  }

  private setupWebNotifications() {
    // Aquí puedes implementar la lógica de notificaciones web usando un servicio de toast o alertas
    this.notificationSubject.subscribe(notification => {
      if (notification) {
        this.alertsService.presentSimpleToast(notification.body, 2000);
      }
    });
  }
}
