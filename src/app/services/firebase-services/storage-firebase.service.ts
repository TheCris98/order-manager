import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { ErrorsFirebaseService } from '../core-services/errors-firebase.service';
import { FirebaseError, Response } from '../../models/navigation';

@Injectable({
  providedIn: 'root'
})
export class StorageFirebaseService {

  constructor(
    private storageFirebase: AngularFireStorage,
    private errorFirebase: ErrorsFirebaseService
  ) { }

  async captureAndUploadImageMobile(): Promise<Response> {
    var response: Response = {
      data: null,
      message: 'Void'
    }
    try {
      // Capturar la imagen
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt // Permite que el usuario elija cámara o galería
      });

      // Leer el archivo como blob
      const res = await fetch(image.webPath!);
      const blob = await res.blob();

      // Generar un nombre único para el archivo en Firebase Storage
      const filePath = `clientes/${new Date().getTime()}_${image.format}`;
      const fileRef = this.storageFirebase.ref(filePath);

      // Subir el archivo
      const task = await fileRef.put(blob); // Usar put para subir el blob directamente

      // Obtener la URL pública
      const url = await task.ref.getDownloadURL();
      response = {
        data: url,
        message: 'Ok'
      }
      return response; // Devolver la URL de la imagen subida
    } catch (error: any) {
      response = {
        data: this.errorFirebase.parseError(error.code),
        message: 'Error'
      }
      return response;
    }
  }

  async captureAndUploadImageWeb(event: any): Promise<Response> {
    var response: Response = {
      data: null,
      message: 'Void'
    }
    try {
      const file = event.target.files[0]; // Acceder al archivo seleccionado
      const filePath = `clientes/${new Date().getTime()}_${file.name}`;
      const fileRef = this.storageFirebase.ref(filePath);
      const task = await fileRef.put(file);
      const url = await task.ref.getDownloadURL();
      response = {
        data: url,
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
