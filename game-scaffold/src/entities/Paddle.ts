import type { Entity } from '../core/Entity';
import { Vector3 } from '../utils/Vector3';
import type { BoundingBox } from '../utils/math';

/**
 * Paddle entity - player controlled
 * Implements Entity interface for EntityManager compatibility.
 */
export class Paddle implements Entity {
  position: Vector3;
  destroyed = false;
  readonly width: number;
  readonly height: number;
  readonly speed: number;
  readonly color: string = '#16213e';
  private targetX: number;
  private screenWidth: number = 800; // Updated in update()

  constructor(x: number, y: number, width: number = 100, height: number = 14) {
    this.position = new Vector3(x, y, 1);
    this.width = width;
    this.height = height;
    this.speed = 800;
    this.targetX = x;
  }

  /** Convenience getter for x position */
  get x(): number {
    return this.position.x;
  }
  set x(value: number) {
    this.position.x = value;
  }

  /** Convenience getter for y position */
  get y(): number {
    return this.position.y;
  }
  set y(value: number) {
    this.position.y = value;
  }

  get bounds(): BoundingBox {
    return {
      x: this.position.x - this.width / 2,
      y: this.position.y,
      width: this.width,
      height: this.height,
    };
  }

  get centerX(): number {
    return this.position.x;
  }

  /**
   * Set target position for smooth movement (mouse/touch)
   */
  setTarget(x: number): void {
    this.targetX = x;
  }

  /**
   * Move paddle by direction (-1 left, 1 right) for keyboard
   */
  move(direction: number, dt: number, screenWidth: number): void {
    this.position.x += direction * this.speed * dt;
    this.screenWidth = screenWidth;
    this.clamp();
    this.targetX = this.position.x;
  }

  update(dt: number): void {
    // Smooth interpolation toward target
    const diff = this.targetX - this.position.x;
    this.position.x += diff * Math.min(1, dt * 15);
    this.clamp();
  }

  /** Set screen width for clamping (called by game on resize) */
  setScreenWidth(width: number): void {
    this.screenWidth = width;
  }

  private clamp(): void {
    const halfWidth = this.width / 2;
    this.position.x = Math.max(halfWidth, Math.min(this.screenWidth - halfWidth, this.position.x));
  }

  render(ctx: CanvasRenderingContext2D): void {
    const bounds = this.bounds;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 4);
    ctx.fill();
  }
}
