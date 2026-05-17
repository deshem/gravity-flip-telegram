export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.startX = 0;
    this.startY = 0;
    this.active = false;

    scene.input.on('pointerdown', (pointer) => {
      this.startX = pointer.x;
      this.startY = pointer.y;
      this.active = true;
    });

    scene.input.on('pointerup', (pointer) => {
      if (!this.active) return;
      this.active = false;

      const deltaY = pointer.y - this.startY;
      const deltaX = pointer.x - this.startX;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY < -50) scene.events.emit('flipGravityUp');
        if (deltaY > 50) scene.events.emit('flipGravityDown');
      } else {
        if (deltaX < -30) scene.events.emit('moveLeft');
        if (deltaX > 30) scene.events.emit('moveRight');
      }
    });

    scene.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      const dx = pointer.x - this.startX;
      if (Math.abs(dx) > 8) {
        scene.events.emit('tilt', Math.max(-1, Math.min(1, dx / 80)));
      }
    });
  }

  destroy() {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
    this.scene.input.off('pointermove');
  }
}
