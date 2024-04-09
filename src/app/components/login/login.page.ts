import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginData } from 'src/app/models/auth';
import { AlertsService } from 'src/app/services/alerts.service';
import { AuthFirebaseService } from 'src/app/services/auth-firebase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: UntypedFormGroup;
  showPassword : boolean = false;
  constructor(
    private loginFormBuilder: UntypedFormBuilder,
    private authFirebaseSerive: AuthFirebaseService,
    private alertService : AlertsService,
    private router : Router,
  ) {
    this.loginForm = this.loginFormBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    })
    if(this.authFirebaseSerive.loadUserFromLocalStorage()){
      this.router.navigate(['/folder'])
    }
  }

  ngOnInit() {
  }

  async login() {
    const data : LoginData = this.loginForm.value;
    const response = await this.authFirebaseSerive.login(data);
    if ('email' in response.data) {
      // Navegar a la página principal
      this.router.navigate(['/folder/profile'])
      this.loginForm.reset()
    } else {
      // Mostrar mensaje de error
      this.alertService.presentCustomToast(response.data)
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
