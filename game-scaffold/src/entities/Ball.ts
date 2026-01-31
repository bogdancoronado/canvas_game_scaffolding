import { Vector2 } from '../utils/math';
import type { AABB } from '../utils/math';

/**
 * Ball entity - bounces around and destroys bricks
 */
export class Ball {
  position: Vector2;
  velocity: Vector2;
  readonly radius: number;
  readonly speed: number;
  readonly color: string = '#e94560';

  constructor(x: number, y: number, radius: number = 8, speed: number = 400) {
    this.position = new Vector2(x, y);
    this.radius = radius;
    this.speed = speed;
    // Start with random upward angle
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
    this.velocity = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  get bounds(): AABB {
    return {
      x: this.position.x - this.radius,
      y: this.position.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }

  update(dt: number): void {
    this.position = this.position.add(this.velocity.scale(dt));
  }

  reflectX(): void {
    this.velocity.x *= -1;
  }

  reflectY(): void {
    this.velocity.y *= -1;
  }

  /**
   * Reflect off paddle with angle based on hit position
   */
  reflectOffPaddle(paddleCenterX: number, paddleWidth: number): void {
    // Calculate hit position relative to paddle center (-1 to 1)
    const hitPos = (this.position.x - paddleCenterX) / (paddleWidth / 2);
    // Clamp and create new angle
    const maxAngle = Math.PI / 3; // 60 degrees max
    const angle = -Math.PI / 2 + hitPos * maxAngle;
    this.velocity = new Vector2(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
