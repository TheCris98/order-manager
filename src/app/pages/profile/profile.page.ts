import { Component, OnInit } from '@angular/core';
import { UserData } from 'src/app/models/navigation';
import { AuthFirebaseService } from 'src/app/services/firebase-services/auth-firebase.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user : UserData = this.authFirebaseService.loadUserFromLocalStorage();
  constructor(private authFirebaseService: AuthFirebaseService) {
  }

  ngOnInit() {
  }

}
