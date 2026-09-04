import Phaser from 'phaser';
import { InputManager } from '../utils/InputManager.js';
import { Storage } from '../utils/Storage.js';
import { haptic } from '../utils/TelegramApp.js';
import { music } from '../utils/MusicManager.js';
import { addText } from '../utils/UI.js';
import { trackPlayer } from '../utils/Stats.js';

const GRAVITY = 520;
const JUMP_VELOCITY = -400;
const MOVE_SPEED = 200;
const BOUNCE_COOLDOWN_MS = 140;
const DEATH_OFFSET = 110 * 3;
const MARGIN_X = 28;
const MOVING_PLATFORM_CHANCE = 0.25; // Шанс того, что новая случайная платформа будет двигаться влево-вправо.
const MOVING_PLATFORM_MIN_DURATION = 1600; // Самое быстрое время проезда платформы от края до края.
const MOVING_PLATFORM_MAX_DURATION = 2600; // Самое медленное время проезда платформы от края до края.

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
    trackPlayer();
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
    this.platformTweens = []; // Храним tween'ы движущихся платформ, чтобы ставить их на паузу вместе с игрой.

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
      coin: false,
      moving: false
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
    return this.spawnPlatform(nextX, nextY, { width: nextW, moving: Math.random() < MOVING_PLATFORM_CHANCE });
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
    const { width } = this.scale; // Берём ширину экрана, чтобы задать границы движения платформы.
    const w = opts.width ?? Phaser.Math.Between(88, 118);
    const platform = this.platforms.create(x, y, 'platform');
    platform.setDisplaySize(w, 16);
    platform.refreshBody();
    platform.body.updateFromGameObject();

    const spawnCoin = opts.coin !== false && Math.random() < 0.55;
    if (spawnCoin) {
      const coin = this.coinGroup.create(x, y - 28, 'coin');
      coin.body.setAllowGravity(false);
      platform.attachedCoin = coin; // Привязываем монету к платформе, чтобы она двигалась вместе с ней.
    }

    if (opts.moving) { // Часть платформ получает горизонтальное движение.
      this.makePlatformMove(platform, width); // Запускаем движение платформы от края экрана до края экрана.
    }

    return platform;
  }

  makePlatformMove(platform, screenWidth) { // Настраивает движение одной платформы по горизонтали.
    const halfWidth = platform.displayWidth / 2; // Половина ширины нужна, чтобы платформа не выезжала за экран.
    const leftX = halfWidth + MARGIN_X; // Левая граница движения с небольшим отступом от края.
    const rightX = screenWidth - halfWidth - MARGIN_X; // Правая граница движения с небольшим отступом от края.
    const targetX = platform.x < screenWidth / 2 ? rightX : leftX; // Если платформа ближе к левому краю, сначала едем вправо, иначе влево.
    const duration = Phaser.Math.Between(MOVING_PLATFORM_MIN_DURATION, MOVING_PLATFORM_MAX_DURATION); // Случайная скорость движения делает платформы менее одинаковыми.

    platform.isMoving = true; // Помечаем платформу как движущуюся для читаемости и будущей логики.
    platform.moveTween = this.tweens.add({ // Создаём tween, который двигает платформу по X.
      targets: platform, // Цель tween'а — сама платформа.
      x: targetX, // Конечная точка первого движения.
      duration, // Сколько времени платформа едет до противоположного края.
      ease: 'Sine.easeInOut', // Плавное ускорение и замедление на краях.
      yoyo: true, // После достижения края платформа едет обратно.
      repeat: -1, // Движение повторяется бесконечно.
      onUpdate: () => { // На каждом кадре tween'а обновляем физическое тело.
        platform.refreshBody(); // Static body Phaser не двигается само, поэтому синхронизируем тело с картинкой.
        this.updateAttachedCoin(platform); // Монета над платформой должна ехать вместе с платформой.
      }
    });
    this.platformTweens.push(platform.moveTween); // Запоминаем tween для pause/resume и уборки.
  }

  updateAttachedCoin(platform) { // Передвигает монету, привязанную к движущейся платформе.
    const coin = platform.attachedCoin; // Достаём монету, которую создали вместе с платформой.
    if (!coin?.active) return; // Если монету уже собрали или уничтожили, двигать нечего.
    coin.x = platform.x; // Ставим монету по центру текущей позиции платформы.
    coin.y = platform.y - 28; // Держим монету над платформой на той же высоте, что и при создании.
    coin.body.updateFromGameObject(); // Синхронизируем физическое тело монеты с новой позицией.
  }

  destroyPlatform(platform) { // Аккуратно удаляет платформу и связанные с ней объекты.
    platform.moveTween?.remove(); // Останавливаем tween, чтобы он не пытался двигать удалённую платформу.
    this.platformTweens = this.platformTweens.filter((tween) => tween !== platform.moveTween); // Убираем tween из списка активных tween'ов.
    if (platform.attachedCoin?.active) platform.attachedCoin.destroy(); // Если монета ещё висит над платформой, удаляем её вместе с платформой.
    platform.destroy(); // Удаляем саму платформу из сцены и физики.
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
      this.platformTweens.forEach((tween) => tween.pause()); // Движущиеся платформы тоже останавливаются во время паузы.
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
      this.platformTweens.forEach((tween) => tween.resume()); // После снятия паузы платформы продолжают движение.
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
    Storage.saveBestCoins(this.coins);

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
      if (p.y > this.player.y + height + 200) this.destroyPlatform(p);
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
    this.platformTweens.forEach((tween) => tween.remove());
    this.platformTweens = [];
    this.inputManager?.destroy();
    this.events.off('steer');
    this.events.off('pauseGame');
  }
}
