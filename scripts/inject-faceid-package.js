/**
 * Re-inietta la dipendenza FaceIdPlugin in ios/App/CapApp-SPM/Package.swift.
 * Eseguire dopo "npx cap sync ios" perché il CLI sovrascrive Package.swift
 * e il plugin capacitor-face-id non ha Package.swift (non compatibile SPM).
 *
 * Uso: npx cap sync ios && node scripts/inject-faceid-package.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const packagePath = join(root, 'ios/App/CapApp-SPM/Package.swift');

let content = readFileSync(packagePath, 'utf8');

if (content.includes('FaceIdPlugin')) {
  console.log('  FaceIdPlugin già presente in Package.swift.');
  process.exit(0);
}

// Aggiungi dipendenza: dopo CapacitorStatusBar .package(...
content = content.replace(
    /(\.package\(name: "CapacitorStatusBar", path: "[^"]+"\))\n(\s*)\]/,
    '$1,\n$2        .package(name: "FaceIdPlugin", path: "../../Plugins/FaceIdPlugin")\n$2]'
);

// Aggiungi al target: dopo CapacitorStatusBar .product(...
content = content.replace(
    /(\.product\(name: "CapacitorStatusBar", package: "CapacitorStatusBar"\))\n(\s*)\]/,
    '$1,\n$2                .product(name: "FaceIdPlugin", package: "FaceIdPlugin")\n$2]'
);

writeFileSync(packagePath, content);
console.log('  FaceIdPlugin iniettato in Package.swift.');
