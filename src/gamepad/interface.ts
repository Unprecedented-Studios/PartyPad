export interface GamepadInterface {
  pressButton(button: string): void;
  releaseButton(button: string): void;
  leftStick(x: number, y: number): void;
  rightStick(x: number, y: number): void;
  leftTrigger(value: number): void;
  rightTrigger(value: number): void;
  update(): void;
  reset(): void;
  destroy(): void;
}
