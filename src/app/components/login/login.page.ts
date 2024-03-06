import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginData } from 'src/app/models/auth';
import { AuthFirebaseService } from 'src/app/services/auth-firebase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  //global variables
  loginForm: UntypedFormGroup;
  constructor(
    private loginFormBuilder: UntypedFormBuilder,
    private authFirebaseSerive: AuthFirebaseService,
    private router : Router,
  ) {
    this.loginForm = this.loginFormBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    })
  }

  ngOnInit() {
  }

  async login() {
    const data : LoginData = this.loginForm.value;
    const user = await this.authFirebaseSerive.login(data);
    if (user) {
      // Navegar a la página principal
      console.log("se validó")
      this.router.navigate(['/folder/Inbox'])
      this.loginForm.reset()
    } else {
      // Mostrar mensaje de error
      console.log("error")
    }
    console.log(user)
  }

  //TODO: Agregar toast, gestionar errores de response
}
