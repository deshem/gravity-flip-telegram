import Phaser from 'phaser';
import { InputManager } from '../utils/InputManager.js';
import { Storage } from '../utils/Storage.js';
import { haptic } from '../utils/TelegramApp.js';
import { music } from '../utils/MusicManager.js';
import { addText } from '../utils/UI.js';

const GRAVITY = 520;
const JUMP_VELOCITY = -400;
const MOVE_SPEED = 200;
const BOUNCE_COOLDOWN_MS = 140;
const DEATH_OFFSET = 110 * 3;
const MARGIN_X = 28;

/** Расчёт дальности прыжка по физике arcade */
function computeJumpMetrics() {
  const v = Math.abs(JUMP_VELOCITY);
  const maxHeight = (v * v) / (2 * GRAVITY);
  const airTime = (2 * v) / GRAVITY;
  return {
    maxHeight: maxHeight * 0.82,
    maxReachX: MOVE_SPEED * airTime * 0.7,
    minGapY: 58,
    maxGapY: Math.floor(maxHeight * 0.78)
  };
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(data = {}) {
    this.isReviving = data.revive || false;
    const { width, height } = this.scale;

    this.jumpMetrics = computeJumpMetrics();
    this.score = 0;
    this.coins = 0;
    this.maxHeight = 0;
    this.gameOver = false;
    this.paused = false;
    this.steer = 0;
    this.lastBounceAt = 0;

    this.cameras.main.setBackgroundColor(0x0a0e1a);
    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(0, -100000, width, height + 100000);

    this.platforms = this.physics.add.staticGroup();
    this.coinGroup = this.physics.add.group();

    this.inputManager = new InputManager(this);
    this.events.on('steer', (v) => { this.steer = v; });
    this.events.on('pauseGame', () => this.togglePause());

    const startPlatformY = height - 64;
    this.lastSpawnedPlatform = this.spawnPlatform(width / 2, startPlatformY, {
      width: 150,
      coin: false
    });

    for (let i = 0; i < 10; i++) {
      this.lastSpawnedPlatform = this.spawnNextReachablePlatform(this.lastSpawnedPlatform);
    }

    const platformTop = startPlatformY - 8;
    const playerHalfH = 12;
    this.player = this.physics.add.sprite(width / 2, platformTop - playerHalfH, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.body.setSize(24, 24);

    this.playerSpin = this.tweens.add({
      targets: this.player,
      angle: '+=360',
      duration: 1400,
      repeat: -1,
      ease: 'Linear'
    });

    this.physics.add.collider(
      this.player,
      this.platforms,
      this.onBouncePlatform,
      this.canLandOnPlatform,
      this
    );
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);

    this.startY = this.player.y;
    this.deathY = this.startY + DEATH_OFFSET;

    this.cameras.main.startFollow(this.player, true, 0, 0.12);
    this.cameras.main.setFollowOffset(0, height * 0.25);

    this.time.delayedCall(80, () => {
      if (!this.gameOver) this.bounce();
    });
  }

  /** Следующая платформа всегда в пределах прыжка от предыдущей */
  spawnNextReachablePlatform(fromPlatform) {
    const { width } = this.scale;
    const m = this.jumpMetrics;

    const gapY = Phaser.Math.Between(m.minGapY, m.maxGapY);
    const nextY = fromPlatform.y - gapY;

    const prevW = fromPlatform.displayWidth;
    const nextW = Phaser.Math.Between(88, 118);

    const safeReach = m.maxReachX - (prevW + nextW) / 2 - 12;
    const reach = Math.max(40, safeReach);

    let minX = fromPlatform.x - reach;
    let maxX = fromPlatform.x + reach;

    const halfNext = nextW / 2 + MARGIN_X;
    minX = Math.max(halfNext, minX);
    maxX = Math.min(width - halfNext, maxX);

    if (minX > maxX) {
      minX = halfNext;
      maxX = width - halfNext;
    }

    const nextX = Phaser.Math.Between(Math.floor(minX), Math.floor(maxX));
    return this.spawnPlatform(nextX, nextY, { width: nextW });
  }

  bounce() {
    this.player.setVelocityY(JUMP_VELOCITY);
  }

  canLandOnPlatform(player, platform) {
    if (this.gameOver || this.paused) return false;
    if (player.body.velocity.y <= 0) return false;

    const platformTop = platform.body.top;
    const playerBottom = player.body.bottom;

    return playerBottom >= platformTop - 8 && player.y <= platform.y + 6;
  }

  onBouncePlatform(player, platform) {
    if (this.gameOver || this.paused) return;

    const now = this.time.now;
    if (now - this.lastBounceAt < BOUNCE_COOLDOWN_MS) return;

    const platformTop = platform.body.top;
    player.y = platformTop - player.displayHeight / 2 + 1;
    player.body.updateFromGameObject();

    this.lastBounceAt = now;
    this.bounce();
    haptic('light');
  }

  spawnPlatform(x, y, opts = {}) {
    const w = opts.width ?? Phaser.Math.Between(88, 118);
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
      this.playerSpin?.pause();
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
      this.playerSpin?.resume();
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

    this.player.setVelocityX(this.steer * MOVE_SPEED);
    this.steer *= 0.9;

    const climbed = Math.max(0, (this.startY - this.player.y) / 10);
    this.maxHeight = Math.max(this.maxHeight, climbed);
    this.score = Math.floor(this.maxHeight);
    this.registry.set('score', this.score);

    const worldTop = this.cameras.main.scrollY;
    while (this.lastSpawnedPlatform.y > worldTop - 220) {
      this.lastSpawnedPlatform = this.spawnNextReachablePlatform(this.lastSpawnedPlatform);
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
    this.playerSpin?.stop();
    this.playerSpin?.remove();
    this.inputManager?.destroy();
    this.events.off('steer');
    this.events.off('pauseGame');
  }
}
