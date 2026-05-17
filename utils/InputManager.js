export class InputManager {
  constructor(scene) {
    this.scene = scene;

    scene.input.on('pointerdown', (pointer) => {
      scene.events.emit('jump');
      const { width } = scene.scale;
      const dir = (pointer.x / width - 0.5) * 2;
      scene.events.emit('steer', Math.max(-1, Math.min(1, dir)));
    });

    scene.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      const { width } = scene.scale;
      const dir = (pointer.x / width - 0.5) * 2;
      scene.events.emit('steer', Math.max(-1, Math.min(1, dir)));
    });
  }

  destroy() {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
  }
}
