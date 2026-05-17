import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const { width } = this.scale;
    this.registry.set('score', 0);
    this.registry.set('coins', 0);

    this.scoreText = this.add.text(16, 16, '0 m', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#f8fafc',
      stroke: '#0f172a',
      strokeThickness: 3
    }).setScrollFactor(0).setDepth(10);

    this.coinText = this.add.text(16, 48, '0', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#fbbf24',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setScrollFactor(0).setDepth(10);

    this.add.text(36, 48, '', {}).setScrollFactor(0);
    this.coinIcon = this.add.image(28, 56, 'coin').setScale(0.7).setScrollFactor(0).setDepth(10);

    const pauseBtn = this.add.text(width - 16, 16, 'II', {
      fontSize: '20px',
      color: '#94a3b8',
      backgroundColor: '#1e293b',
      padding: { x: 10, y: 6 }
    }).setOrigin(1, 0).setInteractive().setScrollFactor(0).setDepth(10);

    pauseBtn.on('pointerdown', () => {
      this.scene.get('GameScene')?.events.emit('pauseGame');
    });

    this.registry.events.on('changedata-score', this.updateScore, this);
    this.registry.events.on('changedata-coins', this.updateCoins, this);

    this.events.on('shutdown', () => {
      this.registry.events.off('changedata-score', this.updateScore, this);
      this.registry.events.off('changedata-coins', this.updateCoins, this);
    });
  }

  update() {
    const game = this.scene.get('GameScene');
    if (!game?.scene?.isActive()) return;

    const score = game.registry?.get?.('score') ?? game.score ?? 0;
    const coins = game.coins ?? 0;
    this.scoreText.setText(`${score} m`);
    this.coinText.setText(String(coins));
    this.coinText.setPosition(36, 48);
  }

  updateScore(parent, value) {
    this.scoreText.setText(`${value} m`);
  }

  updateCoins(parent, value) {
    this.coinText.setText(String(value));
  }
}
