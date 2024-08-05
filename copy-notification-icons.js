const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, 'src/assets/icon/ic_notification.png');
const destDir = path.resolve(__dirname, 'android/app/src/main/res');
const sizes = [
  { dir: 'drawable-mdpi', size: 24 },
  { dir: 'drawable-hdpi', size: 36 },
  { dir: 'drawable-xhdpi', size: 48 },
  { dir: 'drawable-xxhdpi', size: 72 },
  { dir: 'drawable-xxxhdpi', size: 96 }
];

if (!fs.existsSync(srcPath)) {
  console.error(`Source file does not exist at path: ${srcPath}`);
  process.exit(1);
}

sizes.forEach(({ dir }) => {
  const destPath = path.resolve(destDir, `${dir}/ic_notification.png`);
  const destDirPath = path.dirname(destPath);

  if (!fs.existsSync(destDirPath)) {
    fs.mkdirSync(destDirPath, { recursive: true });
  }

  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied to ${destPath}`);
});

console.log('Notification icons copied successfully.');
