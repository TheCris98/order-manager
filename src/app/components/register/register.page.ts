import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterData } from 'src/app/models/auth';
import { AuthFirebaseService } from 'src/app/services/auth-firebase.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
registerForm : UntypedFormGroup;
  constructor(
    private registerFormBuilder: UntypedFormBuilder, 
    private authFirebaseService : AuthFirebaseService,
    private router : Router) {
    this.registerForm = this.registerFormBuilder.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      address: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['',[ Validators.required,Validators.email]],
      password: ['', Validators.required],
      role: ['U', Validators.required],
      avatar: ['', Validators.required]
    })
   }

  ngOnInit() {
  }

  async register(){
    if (this.registerForm.valid) {
      const data : RegisterData = this.registerForm.value
      const result = await this.authFirebaseService.register(data);
      if (result.success) {
        // Manejar registro exitoso, por ejemplo, redirigir al usuario o mostrar un mensaje
        console.log("registrado exitosamente")
        this.router.navigate(['/login'])
      } else {
        // Manejar error de registro
        console.log("kgaste")
      }
    }
  }

  //TODO: Agregar toast, gestionar errores de response, obtener estado de autenticación
}
