import http from 'http';
import fs from 'fs';
fs.writeFileSync('/tmp/partypad-debug.log', 'main.ts started\n');
import { loadConfig } from './config';
import { createApp } from './server/app';
import { setupWebSocket } from './server/ws';
import { GamepadManager } from './server/manager';
import { getLocalIP } from './server/util';

const config = loadConfig();
const manager = new GamepadManager(config.maxPlayers);
const app = createApp(config, manager);
const server = http.createServer(app);

setupWebSocket(server, manager);

const url = `http://${getLocalIP()}:${config.port}`;

function printStartup(): void {
  console.log(`\n  PartyPad server starting at ${url}`);
  console.log('  Open the admin page to see QR code and connection info\n');
}

server.listen(config.port, config.host, () => {
  printStartup();

  if (!config.headless) {
    startElectron();
  } else {
    console.log('  Running in headless mode\n');
  }
});

function startElectron(): void {
  let electronApp: any;
  let BrowserWindow: any;

  try {
    electronApp = require('electron').app;
    BrowserWindow = require('electron').BrowserWindow;
  } catch {
    console.log('  Running in standalone mode (no Electron window)');
    console.log(`  Open ${url}/admin in your browser\n`);
    return;
  }

  if (!electronApp || !BrowserWindow) {
    console.log('  Running in standalone mode (no Electron window)');
    console.log(`  Open ${url}/admin in your browser\n`);
    return;
  }

  let mainWindow: any = null;

  electronApp.whenReady().then(() => {
    mainWindow = new BrowserWindow({
      width: 960,
      height: 600,
      resizable: false,
      title: 'PartyPad',
      autoHideMenuBar: true,
    });

    mainWindow.setMenu(null);
    mainWindow.loadURL(`http://localhost:${config.port}/admin`);

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  });

  electronApp.on('window-all-closed', () => {
    electronApp.quit();
  });

  electronApp.on('before-quit', () => {
    manager.resetAll();
  });
}

function shutdown(): void {
  console.log('\nShutting down...');
  manager.resetAll();
  server.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
