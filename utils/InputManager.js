export class InputManager {
  constructor(scene) {
    this.scene = scene;

    scene.input.on('pointerdown', (pointer) => {
      scene.events.emit('steer', this.getSteer(pointer));
    });

    scene.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      scene.events.emit('steer', this.getSteer(pointer));
    });
  }

  getSteer(pointer) {
    const { width } = this.scene.scale;
    const dir = (pointer.x / width - 0.5) * 2;
    return Math.max(-1, Math.min(1, dir));
  }

  destroy() {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
  }
}
