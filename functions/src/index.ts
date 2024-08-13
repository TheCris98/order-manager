import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const sendOrderDetailUpdateNotification = functions.firestore
  .document("orders/{oId}/details/{dId}")
  .onUpdate(async (change, context) => {
    const beforeDetail = change.before.data();
    const afterDetail = change.after.data();

    // Verificar si el estado del detalle ha cambiado
    if (beforeDetail.state === afterDetail.state) {
      return null; // No hacer nada si el estado no ha cambiado
    }

    try {
      // Obtener el documento de la orden principal
      const orderRef = admin.firestore().collection(
        "orders").doc(context.params.oId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new Error(`Order document does not exist: ${context.params.oId}`);
      }

      const orderData = orderDoc.data() as any;
      const userId = orderData.orderedBy;

      // Verificar si userId está definido
      if (!userId) {
        console.error(`No userId found in order ${context.params.oId}`);
        return null;
      }

      // Obtener el primer documento de la subcolección product
      const productCollectionRef = admin.firestore().collection(
        `orders/${context.params.oId}/details/${context.params.dId}/product`);
      const productSnapshot = await productCollectionRef.limit(1).get();

      if (productSnapshot.empty) {
        throw new Error(`Product document does not exist in order 
          ${context.params.oId} detail ${context.params.dId}`);
      }

      const productDoc = productSnapshot.docs[0];
      const productData = productDoc.data();
      const productName = productData.name;

      // Determinar el mensaje y el conector basado en el estado
      let title = "";
      let message = "";
      switch (afterDetail.state) {
      case "S":
        title = "Orden Solicitada";
        message = "ha sido solicitada";
        break;
      case "P":
        title = "Preparando Orden";
        message = "está siendo preparada";
        break;
      case "L":
        title = "Orden Lista";
        message = "ya está lista";
        break;
      case "E":
        title = "Orden Entregada";
        message = "ha sido entregada";
        break;
      case "F":
        title = "Orden Finalizada";
        message = "fue";
        break;
      default:
        title = "Nueva Actualización";
        message = "recibió una actualización";
        break;
      }

      // Obtener los tokens de los dispositivos del usuario
      const tokensSnapshot = await admin.firestore().collection(
        "deviceTokens").where("userId", "==", userId).get();
      const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

      if (tokens.length > 0) {
        const payload = {
          notification: {
            title: `${title}.`,
            body: `${productName} ${message}.`,
          },
          data: {
            body: `${productName} ${message}.`,
            title: `${title}.`,
          },
        };

        // Enviar la notificación a todos los tokens del usuario
        const response = await admin.messaging().sendToDevice(tokens, payload);

        // Manejar errores de tokens inválidos
        const tokensToRemove = response.results
          .map((result, index) =>
            (result.error ? tokensSnapshot.docs[index].ref.delete() : null))
          .filter((promise) => promise);

        await Promise.all(tokensToRemove);

        console.log("Notification sent successfully", tokens);
        return null;
      } else {
        console.log(`No tokens found for user: ${userId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error sending notification for order 
        ${context.params.oId} detail ${context.params.dId}:`, error);
      return null;
    }
  });
