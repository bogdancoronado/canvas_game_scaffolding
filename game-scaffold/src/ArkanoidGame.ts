import { Game } from './Game';
import { Ball, Paddle, Brick, createBrickGrid } from './entities';
import { aabbCollision, rayIntersectsAABB, Vector2 } from './utils/math';

type GameState = 'playing' | 'won' | 'lost';

/**
 * Arkanoid Game - extends Game base class
 * 
 * Uses the framework's InputManager for all input handling.
 */
export class ArkanoidGame extends Game {
  private paddle: Paddle;
  private ball: Ball;
  private bricks: Brick[] = [];
  private state: GameState = 'playing';
  private lives: number = 3;
  private score: number = 0;

  constructor() {
    super('game-canvas');

    // Initialize game objects
    this.paddle = new Paddle(this.width / 2, this.height - 40);
    this.ball = new Ball(this.width / 2, this.height - 60);

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

  protected update(dt: number): void {

    // Handle restart on click/tap when game is over
    if ((this.state === 'won' || this.state === 'lost') && this.input.isPointerPressed()) {
      this.lives = 3;
      this.score = 0;
      this.resetLevel();
      return;
    }

    if (this.state !== 'playing') return;

    // Keyboard input for paddle movement
    if (this.input.isKeyDown('ArrowLeft') || this.input.isKeyDown('a')) {
      this.paddle.move(-1, dt, this.width);
    }
    if (this.input.isKeyDown('ArrowRight') || this.input.isKeyDown('d')) {
      this.paddle.move(1, dt, this.width);
    }

    // Mouse/touch input for paddle position
    const pointer = this.input.pointerPosition;
    if (pointer) {
      this.paddle.setTarget(pointer.x);
    }

    this.paddle.setScreenWidth(this.width);
    this.paddle.update(dt);

    // Store ball position before movement for CCD
    const ballPrevPos = new Vector2(this.ball.position.x, this.ball.position.y);
    this.ball.move(dt);

    this.handleCollisions(ballPrevPos, dt);
    this.checkWinCondition();
  }

  /**
   * Handle all collision detection and response.
   * Uses CCD (Continuous Collision Detection) for brick collisions to prevent tunneling.
   */
  private handleCollisions(ballPreviousPosition: Vector2, _dt: number): void {
    const ball = this.ball;

    // Wall collisions (simple overlap check is sufficient for walls)
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

    // Paddle collision (simple AABB is fine - paddle is wide and always below ball)
    if (aabbCollision(ball.bounds, this.paddle.bounds) && ball.velocity.y > 0) {
      ball.reflectOffPaddle(this.paddle.centerX, this.paddle.width);
      ball.position.y = this.paddle.y - ball.radius;
    }

    // Brick collisions using CCD (Continuous Collision Detection)
    const ballMovement = new Vector2(
      ball.position.x - ballPreviousPosition.x,
      ball.position.y - ballPreviousPosition.y
    );

    for (const brick of this.bricks) {
      if (!brick.alive) continue;

      // Expand the brick bounds by ball radius (Minkowski sum)
      const expandedBrickBounds = {
        x: brick.bounds.x - ball.radius,
        y: brick.bounds.y - ball.radius,
        width: brick.bounds.width + ball.radius * 2,
        height: brick.bounds.height + ball.radius * 2,
      };

      const hit = rayIntersectsAABB(ballPreviousPosition, ballMovement, expandedBrickBounds);
      if (hit && hit.contactTime >= 0) {
        brick.hit();
        this.score += 10;

        // Move ball to contact point (slightly offset to prevent re-collision)
        const newPos = hit.contactPoint.add(hit.contactNormal.scale(0.1));
        ball.position.x = newPos.x;
        ball.position.y = newPos.y;

        // Reflect based on which face was hit
        if (hit.contactNormal.x !== 0) {
          ball.reflectX();
        } else {
          ball.reflectY();
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
    // Handle pause toggle (must be in render since it runs even when paused)
    if (this.input.isKeyPressed('Escape') && (this.state === 'playing' || this.isPaused)) {
      this.togglePause();
    }

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
    if (this.isPaused) {
      this.renderPauseOverlay();
    } else if (this.state === 'won') {
      this.renderMessage('🎉 YOU WIN!', 'Tap to play again');
    } else if (this.state === 'lost') {
      this.renderMessage('💀 GAME OVER', 'Tap to try again');
    }
  }

  private renderPauseOverlay(): void {
    const ctx = this.ctx;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Pause icon (two vertical bars)
    ctx.fillStyle = '#fff';
    const barWidth = 20;
    const barHeight = 60;
    const gap = 20;
    const centerX = this.width / 2;
    const centerY = this.height / 2 - 30;
    ctx.fillRect(centerX - gap / 2 - barWidth, centerY - barHeight / 2, barWidth, barHeight);
    ctx.fillRect(centerX + gap / 2, centerY - barHeight / 2, barWidth, barHeight);

    // Pause text
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', this.width / 2, this.height / 2 + 40);

    // Instructions
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press ESC to resume', this.width / 2, this.height / 2 + 70);
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
