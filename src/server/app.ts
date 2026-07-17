import express from 'express';
import path from 'path';
import QRCode from 'qrcode';
import { GamepadManager } from './manager';
import { AppConfig } from '../types';
import { getLocalIP } from './util';

export function createApp(config: AppConfig, manager: GamepadManager): express.Application {
  const app = express();
  const staticDir = path.join(__dirname, '..', '..', 'static');

  app.use('/static', express.static(staticDir));

  app.get('/favicon.png', (_req, res) => {
    res.sendFile(path.join(staticDir, 'favicon.png'));
  });

  app.get('/', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });

  app.get('/admin', (_req, res) => {
    res.sendFile(path.join(staticDir, 'admin.html'));
  });

  app.get('/qr', async (_req, res) => {
    const url = `http://${getLocalIP()}:${config.port}`;
    try {
      const pngBuffer = await QRCode.toBuffer(url, {
        width: 200,
        margin: 2,
        color: { dark: '#000', light: '#fff' },
      });
      res.setHeader('Content-Type', 'image/png');
      res.send(pngBuffer);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  app.get('/api/info', (_req, res) => {
    const status = manager.getStatus();
    const url = `http://${getLocalIP()}:${config.port}`;
    res.json({
      url,
      connected_players: status.connected_players,
      max_players: status.max_players,
    });
  });

  app.post('/api/reset', (_req, res) => {
    manager.resetAll();
    res.json({ success: true });
  });

  return app;
}
