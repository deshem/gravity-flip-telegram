const GRAVITY = 520;

export class GravitySystem {
  constructor(player, scene) {
    this.player = player;
    this.scene = scene;
    this.flipped = false;
    this.gravityY = GRAVITY;
  }

  flip() {
    this.flipped = !this.flipped;
    this.gravityY = this.flipped ? -GRAVITY : GRAVITY;
    this.player.body.setGravityY(this.gravityY);
    this.scene.physics.world.gravity.y = this.gravityY;

    if (this.player.body.velocity.y !== 0) {
      this.player.body.setVelocityY(-this.player.body.velocity.y * 0.6);
    }

    this.player.setFlipY(this.flipped);
    return this.flipped;
  }

  setNormal() {
    this.flipped = false;
    this.gravityY = GRAVITY;
    this.player.body.setGravityY(GRAVITY);
    this.scene.physics.world.gravity.y = GRAVITY;
    this.player.setFlipY(false);
  }

  isFlipped() {
    return this.flipped;
  }
}
