import type { Entity } from '../core/Entity';
import { Vector3 } from '../utils/Vector3';
import { Vector2 } from '../utils/math';
import type { AABB } from '../utils/math';

/**
 * Ball entity - bounces around and destroys bricks
 * Implements Entity interface for EntityManager compatibility.
 */
export class Ball implements Entity {
  position: Vector3;
  velocity: Vector2;
  destroyed = false;
  readonly radius: number;
  readonly speed: number;
  readonly color: string = '#e94560';

  constructor(x: number, y: number, radius: number = 8, speed: number = 400) {
    this.position = new Vector3(x, y, 1); // z=1 for standard 2D
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

  update(_dt: number): void {
    // Position updated via velocity in game logic, not here
    // This allows CCD to work correctly
  }

  /**
   * Move the ball by its velocity for the given time step.
   * Called by game code AFTER storing previous position for CCD.
   */
  move(dt: number): void {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
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
    const hitPos = (this.position.x - paddleCenterX) / (paddleWidth / 2);
    const maxAngle = Math.PI / 3;
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
