import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0e1a);
    this.add.text(width / 2, height / 2, 'Gravity Flip', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#e2e8f0'
    }).setOrigin(0.5);

    this.time.delayedCall(400, () => this.scene.start('PreloadScene'));
  }
}
