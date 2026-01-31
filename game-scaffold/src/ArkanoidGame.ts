import { Game } from './Game';
import { Ball, Paddle, Brick, createBrickGrid } from './entities';
import { aabbCollision, getCollisionSide } from './utils/math';

type GameState = 'playing' | 'won' | 'lost';

/**
 * Arkanoid Game - extends Game base class
 */
export class ArkanoidGame extends Game {
  private paddle: Paddle;
  private ball: Ball;
  private bricks: Brick[] = [];
  private state: GameState = 'playing';
  private lives: number = 3;
  private score: number = 0;
  private keys: Set<string> = new Set();

  constructor() {
    super('game-canvas');

    // Initialize game objects
    this.paddle = new Paddle(this.width / 2, this.height - 40);
    this.ball = new Ball(this.width / 2, this.height - 60);

    this.setupInputs();
    this.resetLevel();
  }

  protected onResize(): void {
    // Guard against being called before paddle is initialized (during super constructor)
    if (this.paddle) {
      this.paddle.y = this.height - 40;
    }
  }

  private resetLevel(): void {
    this.bricks = createBrickGrid(this.width);
    this.resetBall();
    this.state = 'playing';
  }

  private resetBall(): void {
    this.ball = new Ball(this.paddle.x, this.paddle.y - 20);
  }

  private setupInputs(): void {
    // Keyboard
    window.addEventListener('keydown', (e) => this.keys.add(e.key));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));

    // Mouse
    window.addEventListener('mousemove', (e) => {
      this.paddle.setTarget(e.clientX);
    });

    // Touch
    window.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        this.paddle.setTarget(e.touches[0].clientX);
      }
    }, { passive: false });

    // Restart on click/touch when game over
    window.addEventListener('click', () => this.handleRestart());
    window.addEventListener('touchstart', () => this.handleRestart());
  }

  private handleRestart(): void {
    if (this.state === 'won' || this.state === 'lost') {
      this.lives = 3;
      this.score = 0;
      this.resetLevel();
    }
  }

  protected update(dt: number): void {
    if (this.state !== 'playing') return;

    // Keyboard input
    if (this.keys.has('ArrowLeft') || this.keys.has('a')) {
      this.paddle.move(-1, dt, this.width);
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d')) {
      this.paddle.move(1, dt, this.width);
    }

    this.paddle.update(dt, this.width);
    this.ball.update(dt);

    this.handleCollisions();
    this.checkWinCondition();
  }

  private handleCollisions(): void {
    const ball = this.ball;

    // Wall collisions
    if (ball.position.x - ball.radius <= 0 || ball.position.x + ball.radius >= this.width) {
      ball.reflectX();
      ball.position.x = Math.max(ball.radius, Math.min(this.width - ball.radius, ball.position.x));
    }
    if (ball.position.y - ball.radius <= 0) {
      ball.reflectY();
      ball.position.y = ball.radius;
    }

    // Ball fell below screen
    if (ball.position.y - ball.radius > this.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.state = 'lost';
      } else {
        this.resetBall();
      }
      return;
    }

    // Paddle collision
    if (aabbCollision(ball.bounds, this.paddle.bounds) && ball.velocity.y > 0) {
      ball.reflectOffPaddle(this.paddle.centerX, this.paddle.width);
      ball.position.y = this.paddle.y - ball.radius;
    }

    // Brick collisions
    for (const brick of this.bricks) {
      if (!brick.alive) continue;

      const side = getCollisionSide(ball.bounds, brick.bounds, ball.velocity);
      if (side) {
        brick.hit();
        this.score += 10;

        if (side === 'top' || side === 'bottom') {
          ball.reflectY();
        } else {
          ball.reflectX();
        }
        break; // Only hit one brick per frame
      }
    }
  }

  private checkWinCondition(): void {
    const remaining = this.bricks.filter((b) => b.alive).length;
    if (remaining === 0) {
      this.state = 'won';
    }
  }

  protected render(): void {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, this.width, this.height);

    // Game objects
    this.bricks.forEach((b) => b.render(ctx));
    this.paddle.render(ctx);
    this.ball.render(ctx);

    // HUD
    this.renderHUD();

    // Overlay messages
    if (this.state === 'won') {
      this.renderMessage('🎉 YOU WIN!', 'Tap to play again');
    } else if (this.state === 'lost') {
      this.renderMessage('💀 GAME OVER', 'Tap to try again');
    }
  }

  private renderHUD(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${this.score}`, 12, 12);
    ctx.textAlign = 'right';
    ctx.fillText(`Lives: ${'❤️'.repeat(this.lives)}`, this.width - 12, 12);
  }

  private renderMessage(title: string, subtitle: string): void {
    const ctx = this.ctx;

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, this.width / 2, this.height / 2 - 30);

    // Subtitle
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText(subtitle, this.width / 2, this.height / 2 + 30);
  }
}
