import { WebSocket } from 'ws';
import { GamepadInterface } from '../gamepad/interface';
import { LinuxGamepad } from '../gamepad/linux';

interface PlayerState {
  playerNumber: number;
  gamepad: GamepadInterface;
  stickStates: {
    left: { x: number; y: number };
    right: { x: number; y: number };
  };
}

export class GamepadManager {
  private gamepads: Map<number, GamepadInterface> = new Map();
  private activePlayers: Set<number> = new Set();
  private connections: Map<WebSocket, number> = new Map();
  private stickStates: Map<number, { left: { x: number; y: number }; right: { x: number; y: number } }> = new Map();
  private maxPlayers: number;

  constructor(maxPlayers: number = 4) {
    this.maxPlayers = maxPlayers;
  }

  getAvailablePlayerNumber(): number | null {
    for (let i = 1; i <= this.maxPlayers; i++) {
      if (!this.activePlayers.has(i)) {
        return i;
      }
    }
    return null;
  }

  assignPlayer(ws: WebSocket): number | null {
    const num = this.getAvailablePlayerNumber();
    if (num === null) return null;

    const stickInit = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };

    if (!this.gamepads.has(num)) {
      this.gamepads.set(num, new LinuxGamepad());
      this.stickStates.set(num, stickInit);
    }

    this.activePlayers.add(num);
    this.connections.set(ws, num);

    return num;
  }

  getGamepad(ws: WebSocket): GamepadInterface | undefined {
    const num = this.connections.get(ws);
    if (num === undefined) return undefined;
    return this.gamepads.get(num);
  }

  getPlayerNumber(ws: WebSocket): number | undefined {
    return this.connections.get(ws);
  }

  getStickStates(ws: WebSocket) {
    const num = this.connections.get(ws);
    if (num === undefined) return undefined;
    return this.stickStates.get(num);
  }

  updateStickStates(ws: WebSocket, side: 'left' | 'right', x: number, y: number): void {
    const num = this.connections.get(ws);
    if (num === undefined) return;
    const states = this.stickStates.get(num);
    if (states) {
      states[side].x = x;
      states[side].y = y;
    }
  }

  cleanupPlayer(ws: WebSocket): void {
    const num = this.connections.get(ws);
    if (num === undefined) return;

    const gamepad = this.gamepads.get(num);
    if (gamepad) {
      try {
        gamepad.reset();
        gamepad.update();
        gamepad.destroy();
      } catch {
        // ignore cleanup errors
      }
    }

    this.gamepads.delete(num);
    this.activePlayers.delete(num);
    this.stickStates.delete(num);
    this.connections.delete(ws);
  }

  resetAll(): void {
    for (const [ws, num] of this.connections) {
      try {
        ws.close(1000, 'reset');
      } catch {
        // ignore
      }
      this.cleanupPlayer(ws);
    }
  }

  getStatus(): { connected_players: number; max_players: number } {
    return {
      connected_players: this.activePlayers.size,
      max_players: this.maxPlayers,
    };
  }

  getAllConnections(): [WebSocket, number][] {
    return Array.from(this.connections.entries());
  }
}
