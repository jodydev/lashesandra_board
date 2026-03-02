/**
 * Sincronizza i progetti iOS/Android con l'URL del server Vite in ascolto.
 * Rileva l'IP della rete locale e imposta CAPACITOR_SERVER_URL prima di cap sync.
 * Uso: avvia "npm run dev" in un terminale, poi "npm run live:sync" in un altro.
 */
import { networkInterfaces } from 'node:os';
import { spawnSync } from 'node:child_process';

const PORT = 5173;

function getLocalIP() {
  const nets = networkInterfaces();
  for (const addrs of Object.values(nets)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIP();
const url = `http://${ip}:${PORT}`;

console.log(`\n  Live reload: ${url}`);
console.log('  Assicurati che "npm run dev" sia in esecuzione.\n');

process.env.CAPACITOR_SERVER_URL = url;

const r = spawnSync('npx', ['cap', 'sync'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CAPACITOR_SERVER_URL: url },
});

process.exit(r.status ?? 1);
