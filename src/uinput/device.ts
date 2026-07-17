import koffi from 'koffi';
import {
  O_RDWR, O_NONBLOCK,
  UI_SET_EVBIT, UI_SET_KEYBIT, UI_SET_ABSBIT,
  UI_ABS_SETUP, UI_DEV_SETUP, UI_DEV_CREATE, UI_DEV_DESTROY,
  EV_KEY, EV_ABS, EV_SYN, SYN_REPORT,
  ALL_BUTTONS, ALL_AXES,
  STICK_AXES, TRIGGER_AXES, DPAD_AXES,
  STICK_MAX, STICK_CENTER, TRIGGER_MAX, DPAD_MAX, DPAD_MIN,
  BUS_USB,
} from './constants';

const libc = koffi.load('libc.so.6');

const cOpen = libc.func('int open(const char *path, int flags, int mode)');
const cClose = libc.func('int close(int fd)');
const cIoctl = libc.func('int ioctl(int fd, unsigned long request, ...)');
const cWrite = libc.func('int64_t write(int fd, const void *buf, size_t count)');

const INPUT_EVENT_SIZE = 24;

function makeAbsSetup(code: number, min: number, max: number, fuzz: number, flat: number, resolution: number): Buffer {
  const buf = Buffer.alloc(28);
  buf.writeUInt16LE(code, 0);
  buf.writeInt32LE(0, 4);
  buf.writeInt32LE(min, 8);
  buf.writeInt32LE(max, 12);
  buf.writeInt32LE(fuzz, 16);
  buf.writeInt32LE(flat, 20);
  buf.writeInt32LE(resolution, 24);
  return buf;
}

function makeDevSetup(name: string): Buffer {
  const buf = Buffer.alloc(92);
  buf.writeUInt16LE(BUS_USB, 0);
  buf.writeUInt16LE(0x045E, 2);  // Microsoft vendor ID
  buf.writeUInt16LE(0x028E, 4);  // Xbox 360 product ID
  buf.writeUInt16LE(0x0110, 6);  // version
  const nameBytes = Buffer.from(name, 'utf-8');
  nameBytes.copy(buf, 8, 0, Math.min(nameBytes.length, 80));
  buf.writeUInt32LE(0, 88);       // ff_effects_max
  return buf;
}

function makeInputEvent(type: number, code: number, value: number): Buffer {
  const buf = Buffer.alloc(INPUT_EVENT_SIZE);
  buf.writeBigInt64LE(BigInt(0), 0);
  buf.writeBigInt64LE(BigInt(0), 8);
  buf.writeUInt16LE(type, 16);
  buf.writeUInt16LE(code, 18);
  buf.writeInt32LE(value, 20);
  return buf;
}

export class UInputDevice {
  private fd: number = -1;
  private destroyed: boolean = false;

  create(deviceName: string = 'Virtual Xbox Controller'): void {
    this.fd = cOpen('/dev/uinput', O_RDWR | O_NONBLOCK, 0);
    if (this.fd < 0) {
      const err = koffi.errno();
      if (err === 13) {
        throw new Error(
          'Permission denied opening /dev/uinput.\n' +
          'Add your user to the input group: sudo usermod -a -G input $USER\n' +
          'Then log out and back in.'
        );
      }
      if (err === 2) {
        throw new Error(
          '/dev/uinput not found. Load the uinput kernel module: sudo modprobe uinput'
        );
      }
      throw new Error(`Failed to open /dev/uinput: errno ${err}`);
    }

    cIoctl(this.fd, UI_SET_EVBIT, 'int', EV_KEY);
    cIoctl(this.fd, UI_SET_EVBIT, 'int', EV_ABS);

    for (const btn of ALL_BUTTONS) {
      cIoctl(this.fd, UI_SET_KEYBIT, 'int', btn);
    }

    for (const axis of ALL_AXES) {
      cIoctl(this.fd, UI_SET_ABSBIT, 'int', axis);
    }

    for (const axis of STICK_AXES) {
      cIoctl(this.fd, UI_ABS_SETUP, 'void *', makeAbsSetup(axis, 0, STICK_MAX, 0, 0, 0));
    }

    for (const axis of TRIGGER_AXES) {
      cIoctl(this.fd, UI_ABS_SETUP, 'void *', makeAbsSetup(axis, 0, TRIGGER_MAX, 0, 0, 0));
    }

    for (const axis of DPAD_AXES) {
      cIoctl(this.fd, UI_ABS_SETUP, 'void *', makeAbsSetup(axis, DPAD_MIN, DPAD_MAX, 0, 0, 0));
    }

    cIoctl(this.fd, UI_DEV_SETUP, 'void *', makeDevSetup(deviceName));

    const ret = cIoctl(this.fd, UI_DEV_CREATE, 'int', 0);
    if (ret < 0) {
      const err = koffi.errno();
      this.close();
      throw new Error(`Failed to create uinput device: errno ${err}`);
    }
  }

  sendEvent(type: number, code: number, value: number): void {
    if (this.destroyed || this.fd < 0) return;
    const event = makeInputEvent(type, code, value);
    cWrite(this.fd, event, INPUT_EVENT_SIZE);
    const syn = makeInputEvent(EV_SYN, SYN_REPORT, 0);
    cWrite(this.fd, syn, INPUT_EVENT_SIZE);
  }

  destroy(): void {
    if (this.destroyed || this.fd < 0) return;
    this.destroyed = true;
    cIoctl(this.fd, UI_DEV_DESTROY, 'int', 0);
    this.close();
  }

  private close(): void {
    if (this.fd >= 0) {
      cClose(this.fd);
      this.fd = -1;
    }
  }
}
