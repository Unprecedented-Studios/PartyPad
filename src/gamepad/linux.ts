import { GamepadInterface } from './interface';
import { UInputDevice } from '../uinput/device';
import {
  EV_KEY, EV_ABS,
  BTN_SOUTH, BTN_EAST, BTN_NORTH, BTN_WEST,
  BTN_TL, BTN_TR,
  BTN_SELECT, BTN_START, BTN_MODE,
  BTN_THUMBL, BTN_THUMBR,
  ABS_X, ABS_Y, ABS_Z,
  ABS_RX, ABS_RY, ABS_RZ,
  ABS_HAT0X, ABS_HAT0Y,
  STICK_CENTER, TRIGGER_MAX,
} from '../uinput/constants';

export interface ButtonMapping {
  pressCode: number;
  releaseCode?: number;
  isDpad?: boolean;
  dpadAxis?: number;
  dpadValue?: number;
}

interface AxisMapping {
  axis: number;
  isTrigger?: boolean;
}

export class LinuxGamepad implements GamepadInterface {
  private device: UInputDevice;

  private buttonMap: Record<string, ButtonMapping> = {
    'XUSB_GAMEPAD_A':              { pressCode: BTN_SOUTH },
    'XUSB_GAMEPAD_B':              { pressCode: BTN_EAST },
    'XUSB_GAMEPAD_X':              { pressCode: BTN_WEST },
    'XUSB_GAMEPAD_Y':              { pressCode: BTN_NORTH },
    'XUSB_GAMEPAD_START':          { pressCode: BTN_START },
    'XUSB_GAMEPAD_BACK':           { pressCode: BTN_SELECT },
    'XUSB_GAMEPAD_LEFT_THUMB':     { pressCode: BTN_THUMBL },
    'XUSB_GAMEPAD_RIGHT_THUMB':    { pressCode: BTN_THUMBR },
    'XUSB_GAMEPAD_LEFT_SHOULDER':  { pressCode: BTN_TL },
    'XUSB_GAMEPAD_RIGHT_SHOULDER': { pressCode: BTN_TR },
    'XUSB_GAMEPAD_GUIDE':          { pressCode: BTN_MODE },
    'XUSB_GAMEPAD_DPAD_UP':    { pressCode: 0, isDpad: true, dpadAxis: ABS_HAT0Y, dpadValue: -1 },
    'XUSB_GAMEPAD_DPAD_DOWN':  { pressCode: 0, isDpad: true, dpadAxis: ABS_HAT0Y, dpadValue: 1 },
    'XUSB_GAMEPAD_DPAD_LEFT':  { pressCode: 0, isDpad: true, dpadAxis: ABS_HAT0X, dpadValue: -1 },
    'XUSB_GAMEPAD_DPAD_RIGHT': { pressCode: 0, isDpad: true, dpadAxis: ABS_HAT0X, dpadValue: 1 },
  };

  private axisMap: Record<string, AxisMapping> = {
    'left_stick_x':  { axis: ABS_X },
    'left_stick_y':  { axis: ABS_Y },
    'right_stick_x': { axis: ABS_RX },
    'right_stick_y': { axis: ABS_RY },
    'left_trigger':  { axis: ABS_Z, isTrigger: true },
    'right_trigger': { axis: ABS_RZ, isTrigger: true },
  };

  constructor() {
    this.device = new UInputDevice();
    this.device.create('Virtual Xbox Controller');
  }

  pressButton(button: string): void {
    const mapping = this.buttonMap[button];
    if (!mapping) return;

    if (mapping.isDpad) {
      this.device.sendEvent(EV_ABS, mapping.dpadAxis!, mapping.dpadValue!);
    } else {
      this.device.sendEvent(EV_KEY, mapping.pressCode, 1);
    }
  }

  releaseButton(button: string): void {
    const mapping = this.buttonMap[button];
    if (!mapping) return;

    if (mapping.isDpad) {
      this.device.sendEvent(EV_ABS, mapping.dpadAxis!, 0);
    } else {
      this.device.sendEvent(EV_KEY, mapping.pressCode, 0);
    }
  }

  leftStick(x: number, y: number): void {
    const ux = (x + 32768) >> 1;
    const uy = (-y + 32768) >> 1;
    this.device.sendEvent(EV_ABS, ABS_X, ux);
    this.device.sendEvent(EV_ABS, ABS_Y, uy);
  }

  rightStick(x: number, y: number): void {
    const ux = (x + 32768) >> 1;
    const uy = (-y + 32768) >> 1;
    this.device.sendEvent(EV_ABS, ABS_RX, ux);
    this.device.sendEvent(EV_ABS, ABS_RY, uy);
  }

  leftTrigger(value: number): void {
    this.device.sendEvent(EV_ABS, ABS_Z, value);
  }

  rightTrigger(value: number): void {
    this.device.sendEvent(EV_ABS, ABS_RZ, value);
  }

  update(): void {
    // uinput emits immediately — no-op
  }

  reset(): void {
    for (const [name, mapping] of Object.entries(this.buttonMap)) {
      if (mapping.isDpad) {
        this.device.sendEvent(EV_ABS, mapping.dpadAxis!, 0);
      } else {
        this.device.sendEvent(EV_KEY, mapping.pressCode, 0);
      }
    }

    this.leftStick(0, 0);
    this.rightStick(0, 0);
    this.leftTrigger(0);
    this.rightTrigger(0);
  }

  destroy(): void {
    this.device.destroy();
  }
}
