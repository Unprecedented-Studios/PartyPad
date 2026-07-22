import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { GamepadManager } from './manager';
import { GamepadInterface } from '../gamepad/interface';

const BUTTON_MAP: Record<string, string> = {
  'A': 'XUSB_GAMEPAD_A',
  'B': 'XUSB_GAMEPAD_B',
  'X': 'XUSB_GAMEPAD_X',
  'Y': 'XUSB_GAMEPAD_Y',
  'START': 'XUSB_GAMEPAD_START',
  'SELECT': 'XUSB_GAMEPAD_BACK',
  'LB': 'XUSB_GAMEPAD_LEFT_SHOULDER',
  'RB': 'XUSB_GAMEPAD_RIGHT_SHOULDER',
  'L3': 'XUSB_GAMEPAD_LEFT_THUMB',
  'R3': 'XUSB_GAMEPAD_RIGHT_THUMB',
  'GUIDE': 'XUSB_GAMEPAD_GUIDE',
  'UP': 'XUSB_GAMEPAD_DPAD_UP',
  'DOWN': 'XUSB_GAMEPAD_DPAD_DOWN',
  'LEFT': 'XUSB_GAMEPAD_DPAD_LEFT',
  'RIGHT': 'XUSB_GAMEPAD_DPAD_RIGHT',
};

export function setupWebSocket(server: HttpServer, manager: GamepadManager): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const playerNumber = manager.assignPlayer(ws);

    if (playerNumber === null) {
      ws.close(1000, 'No available player slots');
      return;
    }

    ws.send(JSON.stringify({ type: 'player_number', number: playerNumber }));

    ws.on('message', (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type !== 'input_batch' || !Array.isArray(msg.actions)) return;

        const gamepad = manager.getGamepad(ws);
        if (!gamepad) return;

        for (const action of msg.actions) {
          processAction(action, gamepad, ws, manager);
        }

        gamepad.update();
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      manager.cleanupPlayer(ws);
    });

    ws.on('error', () => {
      manager.cleanupPlayer(ws);
    });
  });

  return wss;
}

function processAction(action: string, gamepad: GamepadInterface, ws: WebSocket, manager: GamepadManager): void {
  const actionLower = action.toLowerCase();

  if (actionLower.includes('thumbstick')) {
    const isRight = actionLower.includes('right-thumbstick');
    let x = 0;
    let y = 0;

    if (!actionLower.includes('-center')) {
      const parts = action.toUpperCase().split('_');
      const direction = parts[parts.length - 1];

      if (direction.includes('DLEFT')) x = -32767;
      if (direction.includes('DRIGHT')) x = 32767;
      if (direction.includes('DUP')) y = 32767;
      if (direction.includes('DDOWN')) y = -32767;

      if (direction.includes('-')) {
        x = Math.trunc(x * 0.7071);
        y = Math.trunc(y * 0.7071);
      }
    }

    if (isRight) {
      gamepad.rightStick(x, y);
    } else {
      gamepad.leftStick(x, y);
    }

    manager.updateStickStates(ws, isRight ? 'right' : 'left', x, y);
    return;
  }

  if (actionUpper(action).includes('BUTTON')) {
    const parts = action.split('_');
    const buttonType = parts[0].toUpperCase();
    const isRelease = action.toUpperCase().includes('RELEASE');

    if (buttonType === 'RT' || buttonType === 'LT') {
      const value = isRelease ? 0 : 255;
      if (buttonType === 'LT') {
        gamepad.leftTrigger(value);
      } else {
        gamepad.rightTrigger(value);
      }
      return;
    }

    const mappedButton = BUTTON_MAP[buttonType];
    if (mappedButton) {
      if (isRelease) {
        gamepad.releaseButton(mappedButton);
      } else {
        gamepad.pressButton(mappedButton);
      }
    }
  }
}

function actionUpper(action: string): string {
  return action.toUpperCase();
}
