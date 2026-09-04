const TILT_DEAD_ZONE = 2;
const TILT_MAX = 22;
const MOTION_DEAD_ZONE = 0.6;
const MOTION_MAX = 6;
const SENSOR_TIMEOUT_MS = 700;

const sensorListenerOptions = { capture: true, passive: true };

/** Запрос доступа к датчикам. На iOS его можно показать только после жеста игрока. */
export async function requestTiltPermission() {
  await requestSensorPermission(window.DeviceOrientationEvent);
  await requestSensorPermission(window.DeviceMotionEvent);
}

async function requestSensorPermission(sensorEvent) {
  const request = sensorEvent?.requestPermission;
  if (typeof request !== 'function') return;
  try {
    await request.call(sensorEvent);
  } catch {
    // Отказ или ошибка WebView: остаётся управление пальцем.
  }
}

export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.tiltSteer = 0;
    this.pointerSteer = 0;
    this.pointerDown = false;
    this.usingTilt = false;
    this.permissionRequested = false;
    this.lastSensorAt = 0;
    this.lastOrientationAt = 0;

    this.onOrientation = (event) => this.handleOrientation(event);
    this.onMotion = (event) => this.handleMotion(event);
    this.onSceneUpdate = () => this.emitCombinedSteer();
    this.onPointerDown = (pointer) => this.handlePointerDown(pointer);
    this.onPointerMove = (pointer) => this.handlePointerMove(pointer);
    this.onPointerUp = () => this.handlePointerUp();

    window.addEventListener('deviceorientation', this.onOrientation, sensorListenerOptions);
    window.addEventListener('deviceorientationabsolute', this.onOrientation, sensorListenerOptions);
    window.addEventListener('devicemotion', this.onMotion, sensorListenerOptions);
    scene.events.on('update', this.onSceneUpdate);
    scene.input.on('pointerdown', this.onPointerDown);
    scene.input.on('pointermove', this.onPointerMove);
    scene.input.on('pointerup', this.onPointerUp);
    scene.input.on('pointerupoutside', this.onPointerUp);
  }

  async handlePointerDown(pointer) {
    await this.ensureTiltPermission();
    this.pointerDown = true;
    this.pointerSteer = this.getPointerSteer(pointer);
  }

  handlePointerMove(pointer) {
    if (!pointer.isDown) return;
    this.pointerDown = true;
    this.pointerSteer = this.getPointerSteer(pointer);
  }

  handlePointerUp() {
    this.pointerDown = false;
    this.pointerSteer = 0;
  }

  async ensureTiltPermission() {
    if (this.permissionRequested) return;
    this.permissionRequested = true;
    await requestTiltPermission();
  }

  handleOrientation(event) {
    const tilt = this.getHorizontalTilt(event);
    if (tilt == null) return;
    this.tiltSteer = this.normalizeAxis(tilt, TILT_DEAD_ZONE, TILT_MAX);
    this.usingTilt = true;
    this.lastSensorAt = performance.now();
    this.lastOrientationAt = this.lastSensorAt;
  }

  handleMotion(event) {
    if (performance.now() - this.lastOrientationAt < SENSOR_TIMEOUT_MS) return;
    const x = this.getHorizontalAcceleration(event);
    if (x == null) return;
    this.tiltSteer = this.normalizeAxis(x, MOTION_DEAD_ZONE, MOTION_MAX);
    this.usingTilt = true;
    this.lastSensorAt = performance.now();
  }

  emitCombinedSteer() {
    const tiltActive = this.usingTilt && performance.now() - this.lastSensorAt <= SENSOR_TIMEOUT_MS;
    const tilt = tiltActive ? this.tiltSteer : 0;
    const pointer = this.pointerDown ? this.pointerSteer : 0;
    const steer = Math.abs(pointer) >= Math.abs(tilt) ? pointer : tilt;
    this.scene.events.emit('steer', steer);
  }

  getHorizontalTilt(event) {
    if (event.gamma == null && event.beta == null) return null;
    const gamma = event.gamma ?? 0;
    const beta = event.beta ?? 0;
    const angle = this.getScreenAngle();
    if (angle === 90) return beta;
    if (angle === -90 || angle === 270) return -beta;
    if (angle === 180) return -gamma;
    return gamma;
  }

  getHorizontalAcceleration(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return null;
    const angle = this.getScreenAngle();
    if (angle === 90) return acc.y ?? null;
    if (angle === -90 || angle === 270) return acc.y == null ? null : -acc.y;
    if (angle === 180) return acc.x == null ? null : -acc.x;
    return acc.x ?? null;
  }

  getScreenAngle() {
    const angle = window.screen?.orientation?.angle ?? window.orientation;
    return typeof angle === 'number' ? angle : 0;
  }

  normalizeAxis(value, deadZone, maxValue) {
    const absValue = Math.abs(value);
    if (absValue < deadZone) return 0;
    const active = value - Math.sign(value) * deadZone;
    const range = maxValue - deadZone;
    return Math.max(-1, Math.min(1, active / range));
  }

  getPointerSteer(pointer) {
    const { width } = this.scene.scale;
    const dir = (pointer.x / width - 0.5) * 2;
    return Math.max(-1, Math.min(1, dir));
  }

  destroy() {
    window.removeEventListener('deviceorientation', this.onOrientation, sensorListenerOptions);
    window.removeEventListener('deviceorientationabsolute', this.onOrientation, sensorListenerOptions);
    window.removeEventListener('devicemotion', this.onMotion, sensorListenerOptions);
    this.scene.events.off('update', this.onSceneUpdate);
    this.scene.input.off('pointerdown', this.onPointerDown);
    this.scene.input.off('pointermove', this.onPointerMove);
    this.scene.input.off('pointerup', this.onPointerUp);
    this.scene.input.off('pointerupoutside', this.onPointerUp);
  }
}
