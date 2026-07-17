import path from 'path';
import fs from 'fs';
import { AppConfig } from './types';

export function loadConfig(): AppConfig {
  const defaults: AppConfig = {
    host: '0.0.0.0',
    port: 8000,
    maxPlayers: 4,
    headless: false,
  };

  const config: AppConfig = { ...defaults };

  const configPath = path.join(__dirname, '..', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const fileConfig = JSON.parse(raw);
      Object.assign(config, fileConfig);
    } catch {
      // use defaults
    }
  }

  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--host':
        config.host = args[++i] || config.host;
        break;
      case '--port':
        config.port = parseInt(args[++i], 10) || config.port;
        break;
      case '--max-players':
        config.maxPlayers = parseInt(args[++i], 10) || config.maxPlayers;
        break;
      case '--headless':
        config.headless = true;
        break;
    }
  }

  return config;
}
