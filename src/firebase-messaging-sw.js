importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAeDigtxMb4aMxkBLarl93l2MXnrnXPFy8",
  authDomain: "order-manager-5b0dc.firebaseapp.com",
  projectId: "order-manager-5b0dc",
  storageBucket: "order-manager-5b0dc.appspot.com",
  messagingSenderId: "114894812362",
  appId: "1:114894812362:web:61049df5412f1d5a4f3033",
  measurementId: "G-VYTVV4RYJ3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
