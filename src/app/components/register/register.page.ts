import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { RegisterData } from 'src/app/models/auth';
import { UserData } from 'src/app/models/navigation';
import { AlertsService } from 'src/app/services/core-services/alerts.service';
import { AuthFirebaseService } from 'src/app/services/firebase-services/auth-firebase.service';
import { StorageFirebaseService } from 'src/app/services/firebase-services/storage-firebase.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm: UntypedFormGroup;
  platform: string;
  showPassword : boolean = false;
  user : UserData = this.authFirebaseService.loadUserFromLocalStorage();
  constructor(
    private registerFormBuilder: UntypedFormBuilder,
    private authFirebaseService: AuthFirebaseService,
    private storageFirebaseService: StorageFirebaseService,
    private alertService: AlertsService,
    private router: Router) {
    this.registerForm = this.registerFormBuilder.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      address: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['U', Validators.required],
      avatar: ['', Validators.required]
    })
    this.platform = Capacitor.getPlatform()
  }

  ngOnInit() {
  }
  
  async register() {
    if (this.registerForm.valid) {
      const data: RegisterData = this.registerForm.value
      const response = await this.authFirebaseService.register(data);
      if (response.message === 'Ok') {
        // Manejar registro exitoso, por ejemplo, redirigir al usuario o mostrar un mensaje
        this.alertService.presentSimpleToast('Usuario registrado exitosamente')
        this.router.navigate(['/login'])
        this.registerForm.reset()
      } else {
        // Manejar error de registro
        this.alertService.presentCustomToast(response.data)
      }
    }
  }

  async uploadImage() {
    const response = await this.storageFirebaseService.captureAndUploadImageMobile();
    if (response.message === 'Ok') {
      this.registerForm.patchValue({
        avatar: response.data
      });
    } else {
      this.alertService.presentCustomToast(response.data)
      this.registerForm.patchValue({
        avatar: null
      });
    }
  }

  async uploadFile(event: any) {
    const response = await this.storageFirebaseService.captureAndUploadImageWeb(event);
    if (response.message === 'Ok') {
      this.registerForm.patchValue({
        avatar: response.data
      });
    } else {
      this.alertService.presentCustomToast(response.data)
      this.registerForm.patchValue({
        avatar: null
      });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}