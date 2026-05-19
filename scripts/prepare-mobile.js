const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'www');

const itemsToCopy = [
  'index.html',
  'css',
  'js'
];

function removeDir(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function copyRecursive(source, destination) {
  const stats = fs.statSync(source);

  if (stats.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });

    for (const item of fs.readdirSync(source)) {
      copyRecursive(path.join(source, item), path.join(destination, item));
    }

    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

removeDir(webDir);
fs.mkdirSync(webDir, { recursive: true });

for (const item of itemsToCopy) {
  const source = path.join(rootDir, item);
  const destination = path.join(webDir, item);

  if (!fs.existsSync(source)) {
    console.warn(`Arquivo ou pasta não encontrado: ${item}`);
    continue;
  }

  copyRecursive(source, destination);
}

console.log('Pasta www preparada para o Capacitor.');
