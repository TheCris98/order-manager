import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { LoginData, RegisterData } from '../models/auth';
import { UserData } from '../models/navigation';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthFirebaseService {

  constructor(private authFirebase: AngularFireAuth, private fireStore: AngularFirestore) { }

  async login(data: LoginData): Promise<UserData | null> {
    try {
      const result = await this.authFirebase.signInWithEmailAndPassword(data.email, data.password);
      if (result.user) {
        const userDocRef = this.fireStore.doc(`users/${result.user.uid}`).get();
        const userDoc = await firstValueFrom(userDocRef);

        if (!userDoc.exists) {
          console.log('Documento de usuario no encontrado.');
          return null;
        }

        const docData = userDoc.data() as any;
        if (!docData) {
          console.log('No se pudieron obtener datos del documento.');
          return null;
        }

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

        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error al iniciar sesión', error);
      return null;
    }
  }


  async register(data: RegisterData): Promise<any> {
    try {
      // Crear usuario con email y password para autenticación
      const result = await this.authFirebase.createUserWithEmailAndPassword(data.email, data.password);
      if (result.user) {
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
          fechaCreacion: new Date()
        });
        return { success: true };
      }
    } catch (error) {
      console.error('Error al registrar usuario', error);
      return { success: false, error };
    }
  }
}
