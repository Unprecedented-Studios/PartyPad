export interface AppConfig {
  host: string;
  port: number;
  maxPlayers: number;
  headless: boolean;
}

export interface PlayerInfo {
  playerNumber: number;
  stickStates: {
    left: { x: number; y: number };
    right: { x: number; y: number };
  };
}

export interface ApiInfo {
  url: string;
  connected_players: number;
  max_players: number;
}

export interface WsMessage {
  type: string;
  number?: number;
  actions?: string[];
}

export interface ButtonDef {
  name: string;
}
