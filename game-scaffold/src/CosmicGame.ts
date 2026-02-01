import { Game } from './Game';
import { SpaceShip } from './entities/SpaceShip';
import { CubeObstacle } from './entities/CubeObstacle';
import { Vector2 } from './utils/math';

/**
 * Cosmic Cube Runner - An infinite runner in pseudo-3D space.
 *
 * The player pilots a spaceship through an oncoming field of cube obstacles,
 * using perspective projection to create depth on a 2D canvas. Features:
 * - Procedurally spawned obstacles with increasing difficulty
 * - Speed increases as score grows
 * - Starfield parallax background
 * - Simple X-distance collision at player Z-depth
 *
 * @extends Game
 * @see SpaceShip for player entity
 * @see CubeObstacle for obstacle entities
 * @see docs/cosmic.md for full design documentation
 */
export class CosmicGame extends Game {
  private ship: SpaceShip;
  private obstacles: CubeObstacle[] = [];

  private score: number = 0;
  private gameSpeed: number = 20; // World units per second
  private spawnTimer: number = 0;
  private isGameOver: boolean = false;

  constructor(onReturnToMenu?: () => void) {
    super('game-canvas', onReturnToMenu);
    this.ship = new SpaceShip();
  }

  protected update(dt: number): void {
    if (this.isGameOver) {
      if (this.input.isKeyPressed('Space') || this.input.isKeyPressed(' ') || this.input.isPointerPressed()) {
        this.resetGame();
      }
      return;
    }

    // 1. Update Ship
    this.ship.update(dt, this.input, this.width);

    // 2. Spawn Obstacles
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = 0.5 - (this.score * 0.001); // Get harder
      this.spawnTimer = Math.max(0.1, this.spawnTimer);
    }

    // 3. Update Obstacles
    // Use reverse loop to remove safely
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const ob = this.obstacles[i];
      ob.update(dt, this.gameSpeed);

      if (ob.destroyed) {
        this.obstacles.splice(i, 1);
        this.score += 10;
        this.gameSpeed += 0.5; // Accelerate
        continue;
      }

      // Collision Check
      // Only check if z is close to player (player at z=1)
      if (Math.abs(ob.position.z - 1) < 0.5) {
        // Check X overlap
        // Cube width is roughly 50, Ship width roughly 30
        const dist = Math.abs(ob.position.x - this.ship.position.x);
        if (dist < 45) {
          this.gameOver();
        }
      }
    }
  }

  protected render(): void {
    // Check for pause toggle
    if (this.input.isKeyPressed('Escape') && !this.isGameOver) {
      if (!this.isPaused) {
        this.pause();
      }
      // When paused, ESC is handled by base class pause menu
    }

    // 1. Clear Background (Deep Space)
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Center Helper
    const center = new Vector2(this.width / 2, this.height / 2);

    // 3. Draw Stars (Simple dots moving for parallax)
    this.renderStars(center);

    // 4. Draw Obstacles (Painter's Algo: Sort Z desc)
    this.obstacles.sort((a, b) => b.position.z - a.position.z);
    this.obstacles.forEach(ob => ob.render(this.ctx, center));

    // 5. Draw Ship
    this.ship.render(this.ctx, center);

    // 6. UI
    this.renderUI();
  }

  private starOffset = 0;
  private renderStars(center: Vector2) {
    this.starOffset += this.gameSpeed * 0.1;
    this.ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      // Deterministic random
      const x = (Math.sin(i * 132.1) * 1000);
      const y = (Math.cos(i * 54.3) * 1000);
      let z = (i * 2 - this.starOffset) % 100;
      if (z < 1) z += 100;

      const scale = 1 / z;
      const screenX = center.x + x * scale;
      const screenY = center.y + y * scale;

      this.ctx.fillRect(screenX, screenY, 2 * scale, 2 * scale);
    }
  }

  private spawnObstacle() {
    // Spawn at z=100
    // Random X between -300 and 300
    const x = (Math.random() - 0.5) * 600;
    const y = 150; // Floor level same as ship
    this.obstacles.push(new CubeObstacle(x, y, 100));
  }

  private gameOver() {
    this.isGameOver = true;
  }

  private resetGame() {
    this.isGameOver = false;
    this.obstacles = [];
    this.score = 0;
    this.gameSpeed = 20;
    this.ship = new SpaceShip();
  }

  private renderUI() {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px monospace';
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
    this.ctx.fillText(`SPEED: ${Math.floor(this.gameSpeed)}`, 20, 50);

    // Pause Overlay
    if (this.isPaused) {
      this.renderPauseMenu();
      return;
    }

    if (this.isGameOver) {
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'center';
      this.ctx.font = '40px monospace';
      this.ctx.fillText('CRITICAL FAILURE', this.width / 2, this.height / 2);
      this.ctx.font = '20px monospace';
      this.ctx.fillText('Press SPACE to Reboot', this.width / 2, this.height / 2 + 40);
      this.ctx.textAlign = 'left';
    }
  }
}
