import { Injectable, Injector } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AlertsService } from './alerts.service';
import { AuthFirebaseService } from '../firebase-services/auth-firebase.service';
import { DeviceToken } from 'src/app/models/navigation';
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { PushNotifications } from '@capacitor/push-notifications';

@Injectable({
  providedIn: 'root'
})
export class NativeNotificationsService {
  private notificationSubject = new BehaviorSubject<any>(null);
  public notifications$ = this.notificationSubject.asObservable();
  private authService!: AuthFirebaseService;
  private messaging = firebase.messaging();

  constructor(
    private fireStore: AngularFirestore,
    private platform: Platform,
    private alertsService: AlertsService,
    private injector: Injector
  ) { }

  async initializePushNotifications() {
    this.authService = this.injector.get(AuthFirebaseService);

    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      await this.setupMobilePushNotifications();
    } else if (this.platform.is('desktop') || this.platform.is('pwa')) {
      await this.setupWebNotifications();
    }

    this.notifications$.subscribe(notification => {
      if (notification) {
        this.showNotification(notification);
      }
    });
  }

  private setupMobilePushNotifications() {
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      } else {
        console.error('Permission not granted for push notifications');
      }
    });

    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      const user = await this.authService.loadUserFromLocalStorage();
      if (user && user.uid) {
        await this.saveToken(token.value, user.uid);
      } else {
        console.error('User not logged in or user ID not available');
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      this.notificationSubject.next(notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      const payload = notification.notification.data;

      // Verifica si el payload tiene el cuerpo de la notificación
      if (payload) {
        this.notificationSubject.next(payload);
      } else {
        // Si el payload no tiene el cuerpo de la notificación, intenta obtenerlo desde notification.notification
        this.notificationSubject.next({
          body: notification.notification.body || 'Nueva notificación',
          title: notification.notification.title || 'Notificación'
        });
      }
    });
  }


  private async setupWebNotifications() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('Permission not granted for Notification');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = 'BBFbgc9uc49wouHr98mf39Rc-MXm23MM52BHCB3JdA5GZTc_Pjid6Yqq4ME1nMxtjenPm6rTpHT8fB-oj0H_oCs';
      const token = await this.messaging.getToken({
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });
      console.log('Web push registration success, token: ' + token);

      const user = await this.authService.loadUserFromLocalStorage();
      if (user && user.uid) {
        await this.saveToken(token, user.uid);
      } else {
        console.error('User not logged in or user ID not available');
      }

      this.messaging.onMessage((payload) => {
        console.log('Message received. ', payload);
        this.notificationSubject.next(payload.notification);
      });

      setInterval(async () => {
        const newToken = await this.messaging.getToken({
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });
        if (newToken !== token) {
          console.log('Token refreshed: ', newToken);
          if (user && user.uid) {
            await this.saveToken(newToken, user.uid);
          }
        }
      }, 10000); // Actualización cada 10 segundos
    } catch (err) {
      console.error('Unable to get permission to notify.', err);
    }
  }

  private showNotification(notification: any) {
    console.log('AQUI ES XD: ', notification);
    const message = notification.body || notification.notification?.body || 'Nueva notificación';
    this.alertsService.presentSimpleToast(message, 2000);
  }

  public async getToken(): Promise<string> {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      return new Promise((resolve, reject) => {
        PushNotifications.addListener('registration', (token) => {
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          reject(error);
        });

        PushNotifications.requestPermissions().then(result => {
          if (result.receive === 'granted') {
            PushNotifications.register();
          } else {
            reject('Permission not granted for push notifications');
          }
        });
      });
    } else {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = 'BBFbgc9uc49wouHr98mf39Rc-MXm23MM52BHCB3JdA5GZTc_Pjid6Yqq4ME1nMxtjenPm6rTpHT8fB-oj0H_oCs';
      return this.messaging.getToken({
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });
    }
  }

  async saveToken(token: string, userId: string) {
    const deviceTokensRef = this.fireStore.collection('deviceTokens', ref => ref.where('token', '==', token));
    const snapshot = await firstValueFrom(deviceTokensRef.get());

    if (!snapshot.empty) {
      snapshot.forEach((doc: any) => {
        doc.ref.update({
          userId: userId,
          lastUsed: new Date()
        });
      });
    } else {
      const deviceToken: DeviceToken = {
        uid: this.fireStore.createId(),
        userId: userId,
        token: token,
        platform: this.platform.is('cordova') || this.platform.is('capacitor') ? 'mobile' : 'web',
        lastUsed: new Date()
      };

      this.fireStore.collection('deviceTokens').doc(deviceToken.uid).set(deviceToken)
        .then(() => console.log('Token saved successfully'))
        .catch(err => console.error('Error saving token: ', err));
    }
  }
}
