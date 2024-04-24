import { Injectable } from '@angular/core';
import { FirebaseError } from '../../models/navigation';

@Injectable({
  providedIn: 'root'
})
export class ErrorsFirebaseService {

  constructor() { }

  public parseError(errorCode: string): FirebaseError {
    switch (errorCode) {
      // Errores de Autenticación
      case 'auth/user-not-found':
        return { message: "Usuario no registrado.", color: 'danger', icon: 'person-circle' };
      case 'auth/wrong-password':
        return { message: "Contraseña incorrecta.", color: 'danger', icon: 'lock-closed' };
      case 'auth/user-disabled':
        return { message: "Cuenta deshabilitada.", color: 'danger', icon: 'person-circle' };
      case 'auth/email-already-in-use':
        return { message: "Correo en uso.", color: 'warning', icon: 'mail-open' };
      case 'auth/weak-password':
        return { message: "Contraseña débil.", color: 'warning', icon: 'lock-open' };
      case 'auth/invalid-email':
        return { message: "Correo inválido.", color: 'danger', icon: 'mail' };
      case 'auth/invalid-credential':
        return { message: "Credenciales incorrectas.", color: 'danger', icon: 'close-circle' };
      case 'auth/account-exists-with-different-credential':
        return { message: "Correo con otras credenciales.", color: 'warning', icon: 'log-in' };
      case 'auth/operation-not-allowed':
        return { message: "Operación no permitida.", color: 'medium', icon: 'settings' };
      case 'auth/operation-not-supported-in-this-environment':
        return { message: "Operación no soportada aquí.", color: 'medium', icon: 'warning' };
      case 'auth/requires-recent-login':
        return { message: "Requiere reciente inicio de sesión.", color: 'warning', icon: 'time' };
      case 'auth/too-many-requests':
        return { message: "Demasiadas solicitudes.", color: 'danger', icon: 'ban' };
      case 'auth/network-request-failed':
        return { message: "Error de red.", color: 'medium', icon: 'wifi-off' };
      // Errores de Storage
      case 'storage/object-not-found':
        return { message: "Objeto no existe.", color: 'danger', icon: 'cloud-offline' };
      case 'storage/unauthorized':
        return { message: "Sin autorización.", color: 'danger', icon: 'lock-closed' };
      case 'storage/canceled':
        return { message: "Operación cancelada.", color: 'medium', icon: 'close-circle' };
      case 'storage/unknown':
        return { message: "Error desconocido en almacenamiento.", color: 'medium', icon: 'alert-circle' };
      case 'storage/quota-exceeded':
        return { message: "Cuota de almacenamiento superada.", color: 'danger', icon: 'alert-circle' };
      case 'storage/invalid-checksum':
        return { message: "Checksum no coincide.", color: 'danger', icon: 'reload-circle' };
      case 'storage/retry-limit-exceeded':
        return { message: "Límite de reintentos excedido.", color: 'danger', icon: 'time' };
      case 'storage/no-default-bucket':
        return { message: "Sin bucket predeterminado.", color: 'medium', icon: 'build' };
      case 'storage/cannot-slice-blob':
        return { message: "Archivo no procesable.", color: 'danger', icon: 'cut' };
      case 'storage/server-file-wrong-size':
        return { message: "Tamaño de archivo incorrecto.", color: 'danger', icon: 'file-tray-full' };
      //Personalizados
      case 'custom/not-item-found':
        return { message: "No existen coincidencias.", color: 'warning', icon: 'alert-circle' };
      case 'custom/not-id-found':
        return { message: "Identificador erróneo.", color: 'danger', icon: 'alert-circle' };
      default:
        return { message: "Error desconocido.", color: 'medium', icon: 'alert-circle' };
    }
  }
}
