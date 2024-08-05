const fs = require('fs');
const manifestPath = 'android/app/src/main/AndroidManifest.xml';

fs.readFile(manifestPath, 'utf8', (err, data) => {
  if (err) {
    return console.log(err);
  }
  let result = data.replace(/<meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource=".*" \/>/, '<meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_notification" />');

  fs.writeFile(manifestPath, result, 'utf8', (err) => {
    if (err) return console.log(err);
  });
});
