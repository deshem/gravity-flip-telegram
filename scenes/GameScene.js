import Phaser from 'phaser';
import { InputManager } from '../utils/InputManager.js';
import { GravitySystem } from '../utils/GravitySystem.js';
import { Storage } from '../utils/Storage.js';
import { haptic } from '../utils/TelegramApp.js';

const PLATFORM_GAP = 110;

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
    this.tilt = 0;

    this.powerups = { jetpack: 0, magnet: false, shield: false };

    this.cameras.main.setBackgroundColor(0x0a0e1a);
    this.physics.world.setBounds(0, -100000, width, height + 100000);

    this.platforms = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.coinGroup = this.physics.add.group();
    this.powerupGroup = this.physics.add.group();

    this.player = this.physics.add.sprite(width / 2, height - 80, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.1);
    this.player.body.setSize(24, 24);

    this.gravitySystem = new GravitySystem(this.player, this);
    this.inputManager = new InputManager(this);

    this.events.on('flipGravityUp', () => this.tryFlip(-1));
    this.events.on('flipGravityDown', () => this.tryFlip(1));
    this.events.on('tilt', (v) => { this.tilt = v; });
    this.events.on('moveLeft', () => { this.tilt = -1; });
    this.events.on('moveRight', () => { this.tilt = 1; });

    this.events.on('pauseGame', () => this.togglePause());
    this.events.on('revivePlayer', () => this.revive());

    for (let i = 0; i < 8; i++) {
      this.spawnPlatform(width / 2 + Phaser.Math.Between(-80, 80), height - i * PLATFORM_GAP);
    }

    this.physics.add.collider(this.player, this.platforms, this.onLandPlatform, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.powerupGroup, this.collectPowerup, null, this);

    this.nextPlatformY = this.platforms.getChildren().reduce((min, p) => Math.min(min, p.y), height);

    this.cameras.main.startFollow(this.player, true, 0, 0.12);
    this.cameras.main.setFollowOffset(0, height * 0.25);

    if (this.isReviving) {
      this.powerups.shield = true;
      this.time.delayedCall(3000, () => { this.powerups.shield = false; });
    }
  }

  tryFlip(direction) {
    if (this.gameOver || this.paused) return;
    const flipped = this.gravitySystem.isFlipped();
    if ((direction < 0 && !flipped) || (direction > 0 && flipped)) {
      this.gravitySystem.flip();
      haptic('medium');
    }
  }

  spawnPlatform(x, y) {
    const w = Phaser.Math.Between(70, 120);
    const platform = this.platforms.create(x, y, 'platform');
    platform.setDisplaySize(w, 16);
    platform.refreshBody();
    platform.body.updateFromGameObject();

    if (Math.random() < 0.35 && y < this.nextPlatformY - 200) {
      const enemy = this.enemies.create(x + Phaser.Math.Between(-30, 30), y - 24, 'enemy');
      enemy.setVelocityX(Phaser.Math.Between(-60, 60));
      enemy.body.setAllowGravity(false);
      enemy.setBounce(1, 1);
      enemy.setCollideWorldBounds(true);
    }

    if (Math.random() < 0.5) {
      this.coinGroup.create(x, y - 30, 'coin').body.setAllowGravity(false);
    }

    if (Math.random() < 0.08) {
      const types = ['powerup_jet', 'powerup_magnet', 'powerup_shield'];
      const key = Phaser.Utils.Array.GetRandom(types);
      const pu = this.powerupGroup.create(x, y - 40, key);
      pu.body.setAllowGravity(false);
      pu.powerType = key.replace('powerup_', '');
    }
  }

  onLandPlatform(player, platform) {
    if (this.gameOver) return;
    const vy = player.body.velocity.y;
    const onTop = !this.gravitySystem.isFlipped() && player.body.bottom <= platform.body.top + 8 && vy >= 0;
    const onBottom = this.gravitySystem.isFlipped() && player.body.top >= platform.body.bottom - 8 && vy <= 0;

    if (onTop || onBottom) {
      const jump = this.powerups.jetpack > 0 ? -420 : -340;
      player.setVelocityY(jump);
      haptic('light');
    }
  }

  collectCoin(player, coin) {
    coin.destroy();
    this.coins += 1;
    this.registry.set('coins', this.coins);
    haptic('light');
  }

  collectPowerup(player, pu) {
    const type = pu.powerType;
    pu.destroy();
    if (type === 'jet') {
      this.powerups.jetpack = 120;
    } else if (type === 'magnet') {
      this.powerups.magnet = true;
      this.time.delayedCall(5000, () => { this.powerups.magnet = false; });
    } else if (type === 'shield') {
      this.powerups.shield = true;
      this.time.delayedCall(4000, () => { this.powerups.shield = false; });
    }
    haptic('medium');
  }

  hitEnemy(player, enemy) {
    if (this.powerups.shield) {
      enemy.destroy();
      return;
    }
    this.endGame();
  }

  revive() {
    if (this.gameOver) {
      this.scene.restart({ revive: true });
    }
  }

  togglePause() {
    this.paused = !this.paused;
    this.physics.world.pause();
    if (!this.paused) this.physics.world.resume();
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

  update(time, delta) {
    if (this.gameOver || this.paused) return;

    const { width, height } = this.scale;
    const speed = 180 + this.score * 0.5;

    this.player.setVelocityX(this.tilt * speed);
    this.tilt *= 0.92;

    if (this.powerups.jetpack > 0) {
      this.powerups.jetpack -= 1;
      this.player.setVelocityY(-280);
    }

    const worldTop = this.cameras.main.scrollY;
    this.maxHeight = Math.max(this.maxHeight, (height - this.player.y) / 10);
    this.score = Math.floor(this.maxHeight);
    this.registry.set('score', this.score);

    while (this.nextPlatformY > worldTop - 200) {
      this.nextPlatformY -= PLATFORM_GAP + Phaser.Math.Between(0, 40);
      this.spawnPlatform(
        Phaser.Math.Between(40, width - 40),
        this.nextPlatformY
      );
    }

    this.platforms.getChildren().forEach((p) => {
      if (p.y > this.player.y + height + 100) p.destroy();
    });

    if (this.powerups.magnet) {
      this.coinGroup.getChildren().forEach((c) => {
        if (!c.active) return;
        this.physics.moveToObject(c, this.player, 200);
      });
    }

    const fell = !this.gravitySystem.isFlipped()
      ? this.player.y > this.cameras.main.scrollY + height + 120
      : this.player.y < this.cameras.main.scrollY - 120;

    if (fell) this.endGame();

  }

  shutdown() {
    this.inputManager?.destroy();
    this.events.off('flipGravityUp');
    this.events.off('flipGravityDown');
    this.events.off('tilt');
    this.events.off('moveLeft');
    this.events.off('moveRight');
    this.events.off('pauseGame');
    this.events.off('revivePlayer');
  }
}
