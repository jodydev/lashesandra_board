#!/usr/bin/env node
/**
 * Rigenera le splash screen iOS e Android da public/logo.png
 * Richiede sips (macOS).
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.resolve(__dirname, '..');
const logo = path.join(root, 'public', 'logo.png');

if (!fs.existsSync(logo)) {
  console.error('File non trovato: public/logo.png');
  process.exit(1);
}

const iosSplashDir = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

// iOS: 2732x2732 in tutti e 3 i file dell'imageset
console.log('Generazione splash iOS...');
const iosMain = path.join(iosSplashDir, 'splash-2732x2732.png');
run(`sips -z 2732 2732 "${logo}" --out "${iosMain}"`);
for (const name of ['splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  fs.copyFileSync(iosMain, path.join(iosSplashDir, name));
}

// Android: dimensioni per le varie densità
const sizes = [320, 480, 640, 960, 1280];
const pairs = [
  ['drawable', 480],
  ['drawable-port-mdpi', 320],
  ['drawable-port-hdpi', 480],
  ['drawable-port-xhdpi', 640],
  ['drawable-port-xxhdpi', 960],
  ['drawable-port-xxxhdpi', 1280],
  ['drawable-land-mdpi', 320],
  ['drawable-land-hdpi', 480],
  ['drawable-land-xhdpi', 640],
  ['drawable-land-xxhdpi', 960],
  ['drawable-land-xxxhdpi', 1280],
];

console.log('Generazione splash Android...');
for (const size of sizes) {
  const tmp = path.join(res, `_splash_${size}.png`);
  run(`sips -z ${size} ${size} "${logo}" --out "${tmp}"`);
}

for (const [folder, size] of pairs) {
  const src = path.join(res, `_splash_${size}.png`);
  const dest = path.join(res, folder, 'splash.png');
  fs.copyFileSync(src, dest);
}

for (const size of sizes) {
  fs.unlinkSync(path.join(res, `_splash_${size}.png`));
}

console.log('Splash rigenerate da public/logo.png (iOS + Android).');
