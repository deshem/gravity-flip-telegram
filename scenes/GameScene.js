import Phaser from 'phaser';
import { InputManager } from '../utils/InputManager.js';
import { Storage } from '../utils/Storage.js';
import { haptic } from '../utils/TelegramApp.js';
import { music } from '../utils/MusicManager.js';
import { addText } from '../utils/UI.js';

const PLATFORM_GAP = 110;
const DEATH_OFFSET = PLATFORM_GAP * 3;
const JUMP_VELOCITY = -380;
const MOVE_SPEED = 200;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(data = {}) {
    this.isReviving = data.revive || false;
    const { width, height } = this.scale;

    this.score = 0;
    this.coins = 0;
    this.maxHeight = 0;
    this.gameOver = false;
    this.paused = false;
    this.steer = 0;
    this.onGround = false;

    this.cameras.main.setBackgroundColor(0x0a0e1a);
    this.physics.world.gravity.y = 520;
    this.physics.world.setBounds(0, -100000, width, height + 100000);

    this.platforms = this.physics.add.staticGroup();
    this.coinGroup = this.physics.add.group();

    this.inputManager = new InputManager(this);

    this.events.on('jump', () => this.tryJump());
    this.events.on('steer', (v) => { this.steer = v; });
    this.events.on('pauseGame', () => this.togglePause());

    const startPlatformY = height - 64;
    this.spawnPlatform(width / 2, startPlatformY, { width: 150, coin: false });

    for (let i = 1; i < 8; i++) {
      this.spawnPlatform(
        width / 2 + Phaser.Math.Between(-80, 80),
        startPlatformY - i * PLATFORM_GAP
      );
    }

    const platformTop = startPlatformY - 8;
    const playerHalfH = 12;
    this.player = this.physics.add.sprite(width / 2, platformTop - playerHalfH, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.body.setSize(24, 24);
    this.player.setVelocity(0, 0);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);

    this.startY = this.player.y;
    this.deathY = this.startY + DEATH_OFFSET;
    this.onGround = true;

    this.nextPlatformY = this.platforms.getChildren().reduce((min, p) => Math.min(min, p.y), startPlatformY);

    this.cameras.main.startFollow(this.player, true, 0, 0.12);
    this.cameras.main.setFollowOffset(0, height * 0.25);
  }

  tryJump() {
    if (this.gameOver || this.paused) return;

    const touching = this.player.body.blocked.down || this.player.body.touching.down;
    if (touching || this.onGround) {
      this.player.setVelocityY(JUMP_VELOCITY);
      haptic('light');
    }
  }

  spawnPlatform(x, y, opts = {}) {
    const w = opts.width ?? Phaser.Math.Between(70, 120);
    const platform = this.platforms.create(x, y, 'platform');
    platform.setDisplaySize(w, 16);
    platform.refreshBody();
    platform.body.updateFromGameObject();

    const spawnCoin = opts.coin !== false && Math.random() < 0.55;
    if (spawnCoin) {
      const coin = this.coinGroup.create(x, y - 28, 'coin');
      coin.body.setAllowGravity(false);
    }

    return platform;
  }

  collectCoin(player, coin) {
    coin.destroy();
    this.coins += 1;
    this.registry.set('coins', this.coins);
    haptic('light');
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.world.pause();
      music.duck(true);
      const { width, height } = this.scale;
      this.pauseOverlay = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(50);
      this.pauseOverlay.add(this.add.rectangle(0, 0, width, height, 0x000000, 0.55));
      this.pauseOverlay.add(
        addText(this, 0, 0, 'ПАУЗА', Math.round(Math.min(width, height) * 0.08), {
          color: '#f8fafc',
          fontStyle: 'bold',
          align: 'center'
        }).setOrigin(0.5)
      );
    } else {
      this.physics.world.resume();
      music.duck(false);
      this.pauseOverlay?.destroy();
      this.pauseOverlay = null;
    }
  }

  endGame() {
    if (this.gameOver) return;
    this.gameOver = true;
    haptic('heavy');

    const finalScore = Math.floor(this.maxHeight) + this.coins * 10;
    Storage.saveScore(finalScore);
    Storage.saveCoins(Storage.loadCoins() + this.coins);

    this.scene.stop('UIScene');
    this.scene.switch('GameOverScene', {
      score: finalScore,
      coins: this.coins,
      height: Math.floor(this.maxHeight)
    });
  }

  update() {
    if (this.gameOver || this.paused) return;

    const { width, height } = this.scale;

    this.onGround = this.player.body.blocked.down || this.player.body.touching.down;

    this.player.setVelocityX(this.steer * MOVE_SPEED);
    this.steer *= 0.9;

    const climbed = Math.max(0, (this.startY - this.player.y) / 10);
    this.maxHeight = Math.max(this.maxHeight, climbed);
    this.score = Math.floor(this.maxHeight);
    this.registry.set('score', this.score);

    const worldTop = this.cameras.main.scrollY;
    while (this.nextPlatformY > worldTop - 200) {
      this.nextPlatformY -= PLATFORM_GAP + Phaser.Math.Between(0, 40);
      this.spawnPlatform(Phaser.Math.Between(40, width - 40), this.nextPlatformY);
    }

    this.platforms.getChildren().forEach((p) => {
      if (p.y > this.player.y + height + 200) p.destroy();
    });

    this.coinGroup.getChildren().forEach((c) => {
      if (c.y > this.player.y + height + 200) c.destroy();
    });

    if (this.player.y > this.deathY) {
      this.endGame();
    }
  }

  shutdown() {
    this.inputManager?.destroy();
    this.events.off('jump');
    this.events.off('steer');
    this.events.off('pauseGame');
  }
}
