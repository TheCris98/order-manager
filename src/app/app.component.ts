import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { NativeNotificationsService } from './services/core-services/native-notifications.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  
  constructor(
    private platform: Platform,
    private pushNotificationsService: NativeNotificationsService
  ) {
  }

  ngOnInit() {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.pushNotificationsService.initializePushNotifications();
    });
  }
}
