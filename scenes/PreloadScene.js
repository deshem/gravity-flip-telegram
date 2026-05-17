import Phaser from 'phaser';

function drawTexture(scene, key, drawFn, w, h) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  drawFn(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create() {
    drawTexture(this, 'player', (g) => {
      g.fillStyle(0x38bdf8);
      g.fillRoundedRect(0, 0, 28, 28, 6);
      g.fillStyle(0x0ea5e9);
      g.fillCircle(20, 10, 4);
    }, 28, 28);

    drawTexture(this, 'platform', (g) => {
      g.fillStyle(0x475569);
      g.fillRoundedRect(0, 0, 100, 16, 4);
      g.fillStyle(0x64748b);
      g.fillRect(4, 4, 92, 4);
    }, 100, 16);

    drawTexture(this, 'enemy', (g) => {
      g.fillStyle(0xef4444);
      g.fillCircle(14, 14, 14);
      g.fillStyle(0xfca5a5);
      g.fillCircle(10, 10, 4);
      g.fillCircle(18, 10, 4);
    }, 28, 28);

    drawTexture(this, 'coin', (g) => {
      g.fillStyle(0xfbbf24);
      g.fillCircle(10, 10, 10);
      g.fillStyle(0xf59e0b);
      g.fillCircle(10, 10, 6);
    }, 20, 20);

    drawTexture(this, 'powerup_jet', (g) => {
      g.fillStyle(0xa78bfa);
      g.fillTriangle(10, 0, 0, 20, 20, 20);
    }, 20, 20);

    drawTexture(this, 'powerup_magnet', (g) => {
      g.fillStyle(0x22d3ee);
      g.fillRect(4, 0, 4, 10);
      g.fillRect(12, 0, 4, 10);
      g.fillRect(0, 10, 20, 6);
    }, 20, 20);

    drawTexture(this, 'powerup_shield', (g) => {
      g.lineStyle(3, 0x4ade80);
      g.strokeCircle(10, 10, 8);
      g.fillStyle(0x4ade80, 0.3);
      g.fillCircle(10, 10, 8);
    }, 20, 20);

    this.scene.start('MenuScene');
  }
}
