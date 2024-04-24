import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { LoginData, RegisterData } from '../../models/auth';
import { FirebaseError, UserData, Response } from '../../models/navigation';
import { firstValueFrom } from 'rxjs';
import { LocalStorageService } from '../core-services/local-storage.service';
import { ErrorsFirebaseService } from '../core-services/errors-firebase.service';
import { TimeZoneService } from '../core-services/time-zone.service';

@Injectable({
  providedIn: 'root'
})
export class AuthFirebaseService {

  constructor(
    private authFirebase: AngularFireAuth,
    private fireStore: AngularFirestore,
    private localStorage: LocalStorageService,
    private errorFirebase: ErrorsFirebaseService,
    private timeZoneService: TimeZoneService
  ) { }

  async login(data: LoginData): Promise<Response> {
    var response: Response = {
      data: null,
      message: 'Void'
    }
    try {
      const result: any = await this.authFirebase.signInWithEmailAndPassword(data.email, data.password);
      const userDocRef = this.fireStore.doc(`users/${result.user.uid}`).get();
      const userDoc = await firstValueFrom(userDocRef);
      const docData = userDoc.data() as any;
      // Mapeo explícito a la interfaz UserData
      const userData: UserData = {
        uid: result.user.uid, // Asumiendo que deseas mantener el UID del usuario
        email: docData.email,
        name: docData.nombre,
        lastname: docData.apellido,
        address: docData.direccion,
        phone: docData.telefono,
        role: docData.rol,
        avatar: docData.avatar,
        creationDate: docData.fechaCreacion.toDate(), // Convertir Timestamp de Firestore a Date si es necesario
      };
      this.localStorage.setLocalStorageItem('user', userData)
      response = {
        data: userData,
        message: 'Ok'
      }
      return response;
    } catch (error: any) {
      response = {
        data: this.errorFirebase.parseError(error.code),
        message: 'Error'
      }
      return response;
    }
  }

  loadUserFromLocalStorage(): UserData {
    const userJson = this.localStorage.getLocalStorageItem('user')
    if (userJson) {
      return userJson
    } else {
      const response: UserData = {
        uid: '1',
        address: '1st Street',
        avatar: 'https://www.pngplay.com/wp-content/uploads/12/User-Avatar-Profile-PNG-Pic-Clip-Art-Background.png',
        creationDate: new Date(),
        email: 'email@domain.com',
        lastname: 'Doe',
        name: 'John',
        phone: '0999999999',
        role: 'U'
      }
      return response
    }
  }

  async register(data: RegisterData): Promise<Response> {
    var response: Response = {
      data: null,
      message: 'Void'
    }
    try {
      // Crear usuario con email y password para autenticación
      const result: any = await this.authFirebase.createUserWithEmailAndPassword(data.email, data.password);
      const timeResponse = await this.timeZoneService.getTimeByZone('America/Guayaquil');
      const dateTime = timeResponse.message === 'Ok' ? timeResponse.data.datetime : timeResponse.data;
      // Crear documento en Firestore con la misma UID y los datos del formulario
      const userRef = this.fireStore.collection('users').doc(result.user.uid);
      await userRef.set({
        uid: result.user.uid,
        email: data.email,
        nombre: data.name,
        apellido: data.lastname,
        direccion: data.address,
        telefono: data.phone,
        rol: data.role,
        avatar: data.avatar,
        fechaCreacion: dateTime
      })
      response = {
        data: true,
        message: 'Ok'
      }
      return response;
    } catch (error: any) {
      response = {
        data: this.errorFirebase.parseError(error.code),
        message: 'Error'
      }
      return response;
    }
  }
}
