import Phaser from 'phaser';
import { InputManager } from '../utils/InputManager.js';
import { Storage } from '../utils/Storage.js';
import { haptic } from '../utils/TelegramApp.js';
import { music } from '../utils/MusicManager.js';

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

    this.player = this.physics.add.sprite(width / 2, height - 80, 'player');
    this.startY = this.player.y;
    this.deathY = this.startY + DEATH_OFFSET;
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.body.setSize(24, 24);

    this.inputManager = new InputManager(this);

    this.events.on('jump', () => this.tryJump());
    this.events.on('steer', (v) => { this.steer = v; });
    this.events.on('pauseGame', () => this.togglePause());

    for (let i = 0; i < 8; i++) {
      this.spawnPlatform(width / 2 + Phaser.Math.Between(-80, 80), height - i * PLATFORM_GAP);
    }

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);

    this.nextPlatformY = this.platforms.getChildren().reduce((min, p) => Math.min(min, p.y), height);

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

  spawnPlatform(x, y) {
    const w = Phaser.Math.Between(70, 120);
    const platform = this.platforms.create(x, y, 'platform');
    platform.setDisplaySize(w, 16);
    platform.refreshBody();
    platform.body.updateFromGameObject();

    if (Math.random() < 0.55) {
      const coin = this.coinGroup.create(x, y - 28, 'coin');
      coin.body.setAllowGravity(false);
    }
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
    } else {
      this.physics.world.resume();
      music.duck(false);
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
